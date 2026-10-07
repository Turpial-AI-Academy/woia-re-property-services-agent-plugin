// Pure semantic reducer. The host persists returned state with atomic revision fencing.
export const actions = ['account.link','responsibility.record','responsibility.read','query','observation.record','round.evaluate'].map(x => 'property-service.' + x);
const need = (v, m) => { if (!v) throw new Error(m); };
const str = v => typeof v === 'string' && v.length > 0;
const instant = v => { const n=Date.parse(v); need(Number.isFinite(n),'INVALID_TIME'); return n; };
const same = (a,b) => JSON.stringify(a)===JSON.stringify(b);
function effective(r,now) { return instant(r.effective_from)<=now && (!r.effective_until || now<instant(r.effective_until)); }
function authorize(c,now) {
  const a=c.authority;
  need(a && str(a.actor_ref) && str(a.task_ref) && str(a.policy_ref) && str(a.policy_version),'MISSING_AUTHORITY');
  need(a.org_id===c.org_id && a.action===c.action && a.target_id===c.account_id && a.scope_id===c.scope_id && a.department===c.department,'AUTHORITY_SCOPE_MISMATCH');
  need(['asset-management','finance','customer-service','data'].includes(c.department),'DEPARTMENT_DENIED');
  need(c.department!=='customer-service'||['property-service.responsibility.read','property-service.round.evaluate'].includes(c.action),'DEPARTMENT_MUTATION_DENIED');
  need(!a.revoked && !a.hold && effective(a,now),'AUTHORITY_INACTIVE');
}
function source(c, account,now) {
  const m=c.source_map;
  need(m && str(m.ref) && str(m.version) && m.org_id===c.org_id && m.account_id===c.account_id && m.source_ref===account.source_ref && !m.conflicted && effective(m,now),'SOURCE_MAP_REQUIRED');
  need(Number.isFinite(m.max_age_ms) && m.max_age_ms>=0,'FRESHNESS_POLICY_REQUIRED');
  return m;
}
export function empty(org_id) { need(str(org_id),'ORG_REQUIRED'); return {org_id,revision:0,accounts:[],responsibilities:[],observations:[],evaluations:[]}; }
export function execute(state,command,context) {
  const c=structuredClone(command), s=structuredClone(state), now=instant(c.now);
  need(actions.includes(c.action),'UNSUPPORTED_ACTION'); need(s.org_id===c.org_id,'ORG_MISMATCH');
  need(str(c.account_id)&&str(c.scope_id),'TARGET_REQUIRED'); authorize(c,now);
  need(context && context.org_id===c.org_id && context.actor_ref===c.authority.actor_ref && context.task_ref===c.authority.task_ref && context.policy_ref===c.authority.policy_ref && context.policy_version===c.authority.policy_version && context.source_map_version===c.source_map?.version && context.source_map_ref===c.source_map?.ref,'CURRENT_RESOURCES_REQUIRED');
  need(context.now===c.now && context.department===c.department && same(context.authority,c.authority) && same(context.source_map,c.source_map),'TRUSTED_AUTHORITY_MISMATCH');
  need(c.expected_revision===s.revision,'REVISION_CONFLICT');
  let account=s.accounts.find(a=>a.account_id===c.account_id), result;
  if(c.action==='property-service.account.link') {
    const a=c.account;
    need(a && a.account_id===c.account_id && str(a.property_ref)&&str(a.source_ref)&&str(a.external_account_id)&&str(a.lifecycle_scope)&&str(a.evidence_ref),'ACCOUNT_REQUIRED');
    source(c,a,now);
    if(account) { need(same(account,a),'ACCOUNT_IMMUTABLE'); return {state:s,result:account}; }
    need(!s.accounts.some(x=>x.source_ref===a.source_ref&&x.external_account_id===a.external_account_id&&x.lifecycle_scope===a.lifecycle_scope),'DUPLICATE_SOURCE_ACCOUNT');
    s.accounts.push(a); result=a;
  } else {
    need(account,'ACCOUNT_NOT_FOUND');
    if(c.action==='property-service.responsibility.record') {
      source(c,account,now);
      const r=c.responsibility;
      need(r && r.scope_id===c.scope_id && r.account_id===c.account_id && str(r.subject_ref)&&str(r.acceptance_ref)&&str(r.source_ref)&&str(r.version)&&['tenant','owner','agency','other','shared','unknown'].includes(r.role),'ACCEPTED_RESPONSIBILITY_REQUIRED');
      instant(r.effective_from); if(r.effective_until) need(instant(r.effective_until)>instant(r.effective_from),'INVALID_INTERVAL');
      const prior=s.responsibilities.find(x=>x.account_id===r.account_id&&x.scope_id===r.scope_id&&x.version===r.version);
      if(prior) { need(same(prior,r),'RESPONSIBILITY_IMMUTABLE'); return {state:s,result:prior}; }
      s.responsibilities.push(r); result=r;
    } else if(c.action==='property-service.responsibility.read') {
      return {state:s,result:s.responsibilities.filter(r=>r.account_id===c.account_id&&r.scope_id===c.scope_id&&effective(r,now))};
    } else if(c.action==='property-service.query'||c.action==='property-service.observation.record') {
      const m=source(c,account,now); const o=c.observation;
      need(o && o.account_id===c.account_id && str(o.observation_id)&&str(o.source_key)&&str(o.cycle_id)&&o.source_ref===account.source_ref&&str(o.evidence_ref)&&[1,2,3].includes(o.round),'OBSERVATION_REQUIRED');
      need(instant(o.observed_at)<=now,'FUTURE_OBSERVATION'); need(['DEBT','NO_DEBT','UNKNOWN'].includes(o.status),'INVALID_SOURCE_STATUS');
      need(['SUCCESS','FAILED','UNAVAILABLE'].includes(o.query_result),'QUERY_RESULT_REQUIRED');
      const prior=s.observations.find(x=>x.account_id===o.account_id&&x.source_key===o.source_key);
      if(prior) {
        const raw={...prior,status:prior.raw_source_status}; delete raw.raw_source_status;
        need(same(raw,o),'SOURCE_KEY_CONFLICT');
        const result=structuredClone(prior);
        if(o.query_result!=='SUCCESS'||now-instant(o.observed_at)>m.max_age_ms)result.status='UNKNOWN';
        return {state:s,result};
      }
      o.raw_source_status=o.status;
      if(o.query_result!=='SUCCESS'||now-instant(o.observed_at)>m.max_age_ms) o.status='UNKNOWN';
      need(!s.observations.some(x=>x.observation_id===o.observation_id),'DUPLICATE_OBSERVATION_ID');
      s.observations.push(o); result=o;
    } else {
      const map=source(c,account,now), o=s.observations.find(x=>x.observation_id===c.observation_id&&x.account_id===c.account_id);
      need(o && o.cycle_id===c.cycle_id && o.round===c.round,'SCOPED_OBSERVATION_REQUIRED');
      need(str(c.cycle_started_at)&&[1,2,3].includes(c.round),'CYCLE_REQUIRED');
      need(context.cycle_id===c.cycle_id && context.cycle_started_at===c.cycle_started_at && str(context.cycle_acceptance_ref),'ACCEPTED_CYCLE_REQUIRED');
      const previous=s.evaluations.filter(x=>x.account_id===c.account_id&&x.cycle_id===c.cycle_id&&x.scope_id===c.scope_id);
      const duplicate=previous.find(x=>x.round===c.round); if(duplicate) {need(duplicate.observation_id===c.observation_id,'ROUND_ALREADY_EVALUATED');return {state:s,result:duplicate};}
      const prev=previous.find(x=>x.round===c.round-1);
      need(c.round===1 || (prev && prev.route==='CUSTOMER_SERVICE_INPUT' && instant(o.observed_at)>instant(prev.evaluated_at)),'FRESH_QUERY_BEFORE_NEXT_ROUND');
      const due=c.round===1 ? instant(c.cycle_started_at)+14*86400000 : instant(prev.evaluated_at)+(c.round===2?72:48)*3600000;
      need(now>=due,'ROUND_NOT_DUE');
      const rs=s.responsibilities.filter(r=>r.account_id===c.account_id&&r.scope_id===c.scope_id&&effective(r,now));
      const fresh=o.query_result==='SUCCESS' && now-instant(o.observed_at)<=map.max_age_ms;
      const r=rs.length===1?rs[0]:null;
      let role=r?.role;
      if(role==='shared') {
        const rule=c.responsibility_rule;
        const valid=rule && same(rule,context.responsibility_rule) && str(rule.ref)&&str(rule.version)&&str(rule.source_ref)&&str(rule.acceptance_ref)&&/^[a-f0-9]{64}$/.test(rule.digest??'') && r.rule_ref===rule.ref && r.rule_version===rule.version && rule.account_id===c.account_id && effective(rule,now) && Array.isArray(rule.scopes);
        const parts=valid?rule.scopes.filter(x=>x.scope_id===c.scope_id):[];
        role=parts.length===1&&str(parts[0].subject_ref)&&['tenant','owner','agency','other'].includes(parts[0].role)?parts[0].role:'unknown';
      }
      let route='INTERNAL_SOURCE_RESOLUTION', status='UNKNOWN';
      if(fresh && r && !r.disputed && role!=='unknown') {
        status=o.status;
        if(status==='NO_DEBT') route='NO_ACTION';
        else if(status==='DEBT') route=role==='tenant'?'CUSTOMER_SERVICE_INPUT':['owner','agency','other'].includes(role)?'INTERNAL_PROPERTY_MANAGEMENT':'INTERNAL_RESPONSIBILITY_RESOLUTION';
      }
      result={account_id:c.account_id,scope_id:c.scope_id,cycle_id:c.cycle_id,round:c.round,observation_id:o.observation_id,evaluated_at:c.now,status,route,contact_dispatched:false,charge_created:false,fee_business_key:null};
      // Eligibility is only an input to Finance. Never calculate a fee or grant authority.
      const p=c.fee_policy;
      if(c.round===3 && route==='CUSTOMER_SERVICE_INPUT' && p && str(p.ref)&&str(p.version)&&str(p.formula_ref)&&str(p.currency)&&str(p.rounding_ref)&&p.account_id===c.account_id&&p.scope_id===c.scope_id&&effective(p,now)) {
        result.fee_business_key=JSON.stringify([c.account_id,c.cycle_id,p.version,c.scope_id]);
        result.finance_review_required=true;
      }
      s.evaluations.push(result);
    }
  }
  s.revision++; return {state:s,result};
}
