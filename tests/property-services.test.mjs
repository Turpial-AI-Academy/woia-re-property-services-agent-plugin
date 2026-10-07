import {test} from 'node:test';
import assert from 'node:assert/strict';
import {empty,execute} from '../skills/woia-re-property-services/scripts/services.mjs';
const start='2026-01-01T00:00:00Z', now='2026-01-15T00:00:00Z';
const ctx={org_id:'o',actor_ref:'actor',task_ref:'task',policy_ref:'p',policy_version:'1',source_map_ref:'map',source_map_version:'1',cycle_id:'cycle',cycle_started_at:start,cycle_acceptance_ref:'accepted-cycle'};
function cmd(s,action,extra={}) {return {org_id:'o',account_id:'a',scope_id:'scope',department:'asset-management',now,action:'property-service.'+action,expected_revision:s.revision,authority:{org_id:'o',actor_ref:'actor',task_ref:'task',department:'asset-management',policy_ref:'p',policy_version:'1',action:'property-service.'+action,target_id:'a',scope_id:'scope',effective_from:start},source_map:{ref:'map',version:'1',org_id:'o',account_id:'a',source_ref:'utility',effective_from:start,max_age_ms:3600000},...extra};}
function trusted(c) {return {...ctx,now:c.now,department:'asset-management',authority:structuredClone(c.authority),source_map:structuredClone(c.source_map),responsibility_rule:c.responsibility_rule};}
function run(s,action,extra={}) {const c=cmd(s,action,extra);return execute(s,c,trusted(c));}
function setup(role='tenant') {
  let s=run(empty('o'),'account.link',{account:{account_id:'a',property_ref:'property',source_ref:'utility',external_account_id:'ext',lifecycle_scope:'active',evidence_ref:'ev'}}).state;
  s=run(s,'responsibility.record',{responsibility:{account_id:'a',scope_id:'scope',subject_ref:'person',acceptance_ref:'owner-accepted',source_ref:'lease-version',version:'1',role,effective_from:start}}).state;
  return s;
}
function observe(s,extra={}) {return run(s,'query',{observation:{account_id:'a',observation_id:'obs',source_key:'event',cycle_id:'cycle',round:1,source_ref:'utility',evidence_ref:'evidence',observed_at:now,status:'DEBT',query_result:'SUCCESS',...extra}});}
function evaluate(s,extra={}) {return run(s,'round.evaluate',{cycle_id:'cycle',cycle_started_at:start,round:1,observation_id:'obs',...extra});}
test('account and responsibility remain distinct',()=>{const s=setup();assert.equal(s.accounts[0].subject_ref,undefined);assert.equal(s.responsibilities[0].subject_ref,'person');});
for(const [label,extra] of [['failed',{query_result:'FAILED'}],['unavailable',{query_result:'UNAVAILABLE'}],['stale',{observed_at:start}]]) test(label+' debt immediately UNKNOWN preserving original source',()=>{const o=observe(setup(),extra);assert.equal(o.result.status,'UNKNOWN');assert.equal(o.result.raw_source_status,'DEBT');assert.equal(evaluate(o.state).result.status,'UNKNOWN');});
test('stale no-debt never good standing',()=>{assert.equal(observe(setup(),{status:'NO_DEBT',observed_at:start}).result.status,'UNKNOWN');});
test('fresh no debt produces no contact or task',()=>{const r=evaluate(observe(setup(),{status:'NO_DEBT'}).state).result;assert.equal(r.route,'NO_ACTION');assert.equal(r.contact_dispatched,false);assert.equal(r.task_created,undefined);});
for(const role of ['owner','agency','other']) test(role+' debt internally resolved without fee',()=>{const r=evaluate(observe(setup(role)).state).result;assert.equal(r.route,'INTERNAL_PROPERTY_MANAGEMENT');assert.equal(r.fee_business_key,null);});
for(const role of ['shared','unknown']) test(role+' responsibility never inferred',()=>{const r=evaluate(observe(setup(role)).state).result;assert.ok(r.route.startsWith('INTERNAL_'));assert.equal(r.fee_business_key,null);});
test('accepted deterministic shared responsibility resolves exact scope only',()=>{
  let s=setup('shared');s.responsibilities[0].rule_ref='rule';s.responsibilities[0].rule_version='1';s=observe(s).state;
  const rule={ref:'rule',version:'1',source_ref:'accepted-contract',acceptance_ref:'competent-owner',digest:'a'.repeat(64),account_id:'a',effective_from:start,scopes:[{scope_id:'scope',subject_ref:'person',role:'tenant'}]};
  assert.equal(evaluate(s,{responsibility_rule:rule}).result.route,'CUSTOMER_SERVICE_INPUT');
  for(const bad of [{...rule,account_id:'other'},{...rule,digest:'bad'},{...rule,source_ref:''},{...rule,scopes:[{scope_id:'other',subject_ref:'person',role:'tenant'}]},{...rule,scopes:[...rule.scopes,...rule.scopes]}])assert.equal(evaluate(s,{responsibility_rule:bad}).result.status,'UNKNOWN');
});
test('disputed tenant responsibility blocks',()=>{let s=setup();s.responsibilities[0].disputed=true;assert.equal(evaluate(observe(s).state).result.status,'UNKNOWN');});
test('duplicate delivery idempotent, changed source evidence denied',()=>{const s=observe(setup()).state;assert.equal(observe(s).state.revision,s.revision);assert.throws(()=>observe(s,{status:'NO_DEBT'}),/SOURCE_KEY_CONFLICT/);});
test('stale duplicate replays effective UNKNOWN without rewriting original',()=>{const s=observe(setup()).state;const c=cmd(s,'query',{now:'2026-01-16T00:00:00Z',observation:{account_id:'a',observation_id:'obs',source_key:'event',cycle_id:'cycle',round:1,source_ref:'utility',evidence_ref:'evidence',observed_at:now,status:'DEBT',query_result:'SUCCESS'}});const r=execute(s,c,trusted(c));assert.equal(r.result.status,'UNKNOWN');assert.equal(r.state.observations[0].status,'DEBT');assert.equal(r.state.revision,s.revision);});
test('caller cannot alter trusted clock or authority target',()=>{const s=setup(),c=cmd(s,'responsibility.read'),t=trusted(c);c.now=start;assert.throws(()=>execute(s,c,t),/TRUSTED_AUTHORITY_MISMATCH/);c.now=now;c.authority.effective_from='2025-01-01';assert.throws(()=>execute(s,c,t),/TRUSTED_AUTHORITY_MISMATCH/);});
test('caller cannot broaden source freshness policy',()=>{const s=setup(),c=cmd(s,'query'),t=trusted(c);c.source_map.max_age_ms=999999999;assert.throws(()=>execute(s,c,t),/TRUSTED_AUTHORITY_MISMATCH/);});
test('state remains immutable after denied operation',()=>{const s=setup(),before=structuredClone(s);assert.throws(()=>run(s,'query',{expected_revision:0}),/REVISION_CONFLICT/);assert.deepEqual(s,before);});
for(const [label,modify] of [['org',c=>c.org_id='other'],['target',c=>c.authority.target_id='other'],['hold',c=>c.authority.hold=true],['expired',c=>c.authority.effective_until=start],['source',c=>c.source_map.source_ref='unselected']]) test('deny '+label,()=>{const s=setup(),c=cmd(s,label==='source'?'query':'responsibility.read'),t=trusted(c);modify(c);assert.throws(()=>execute(s,c,t));});
test('independent current context required',()=>{assert.throws(()=>execute(setup(),cmd(setup(),'responsibility.read'),{...ctx,policy_version:'2'}),/CURRENT_RESOURCES_REQUIRED/);});
test('Customer Service may not mutate account',()=>{const c=cmd(empty('o'),'account.link');c.department=c.authority.department='customer-service';assert.throws(()=>execute(empty('o'),c,ctx),/DEPARTMENT_MUTATION_DENIED/);});
test('day14 and subsequent fresh72h48h gates, fee input not Charge',()=>{
  let s=observe(setup()).state;
  assert.throws(()=>evaluate(s,{now:'2026-01-14T23:00:00Z'}),/ROUND_NOT_DUE/);
  s=evaluate(s).state;
  assert.throws(()=>evaluate(s,{round:2}),/SCOPED_OBSERVATION_REQUIRED/);
  const t2='2026-01-18T00:00:00Z';
  s=run(s,'query',{now:t2,observation:{account_id:'a',observation_id:'obs2',source_key:'event2',cycle_id:'cycle',round:2,source_ref:'utility',evidence_ref:'ev2',observed_at:t2,status:'DEBT',query_result:'SUCCESS'}}).state;
  s=evaluate(s,{now:t2,round:2,observation_id:'obs2'}).state;
  const t3='2026-01-20T00:00:00Z';
  s=run(s,'query',{now:t3,observation:{account_id:'a',observation_id:'obs3',source_key:'event3',cycle_id:'cycle',round:3,source_ref:'utility',evidence_ref:'ev3',observed_at:t3,status:'DEBT',query_result:'SUCCESS'}}).state;
  const r=evaluate(s,{now:t3,round:3,observation_id:'obs3',fee_policy:{ref:'fee',version:'1',formula_ref:'accepted-formula',currency:'configured',rounding_ref:'accepted-rounding',account_id:'a',scope_id:'scope',effective_from:start}}).result;
  assert.equal(r.fee_business_key,JSON.stringify(['a','cycle','1','scope']));assert.equal(r.charge_created,false);assert.equal(r.contact_dispatched,false);
});
