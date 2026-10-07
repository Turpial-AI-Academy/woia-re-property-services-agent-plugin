---
name: woia-re-property-services
description: Link property service accounts, record accepted responsibility and immutable observations, and evaluate collection rounds without sending notices or creating money.
license: MIT
---

# Property Services

Use for account linkage, scoped responsibility, source queries and day14/+72h/+48h evaluation. Do not use for payments, messaging or rights authority.

1. Resolve current authenticated organization, actor, Task and exact operation/account/scope authority. Load [contract](references/contract.md) for source uncertainty, responsibility or financial consequences.
2. Execute the pure [helper](scripts/services.mjs) with a separate host-resolved current context and explicit clock. Persist returned state atomically with expected-revision fencing; this module is not a datastore or qualified adapter.
3. Retain original source observations. Failed/unavailable/stale status is UNKNOWN. Fresh queries append; duplicate delivery deduplicates without rewriting evidence.
4. Account holder does not determine responsibility. Accepted effective-dated Subject/role/scope is separate. Ambiguity and dispute block collection.
5. Customer Service/Communications alone execute permitted notices. Finance/Ledger alone accept and create authorized fees. Evaluation grants neither permission.

Actions: property-service.account.link, property-service.responsibility.record, property-service.responsibility.read, property-service.query, property-service.observation.record, property-service.round.evaluate.

No live adapter is qualified. Query consumes a configured adapter observation, not an invented backend. Canonical domain relations/E2E remain in Domain Contracts. Operator E2E and Production Ready are separate gates.
