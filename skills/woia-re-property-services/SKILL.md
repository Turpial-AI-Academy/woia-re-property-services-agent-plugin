---
name: woia-re-property-services
description: Source-attributed property service account responsibility observations and bounded round evaluation.
license: MIT
---

# woia-re-property-services

## Operating flow

~~~text
DISCOVER -> DECIDE -> IMPLEMENT -> VALIDATE -> REPORT
~~~

## Purpose

Source-attributed property service account responsibility observations and bounded round evaluation.

## Minimum sufficient evidence

Use a bounded path when an authoritative existing artifact/evidence set is healthy and the requested change is local and understood:

1. identify the artifact/evidence, source candidate, and affected surface;
2. load only supporting context and references needed for that surface;
3. amend or re-evaluate the smallest coherent unit;
4. verify affected behavior plus mandatory cross-cutting invariants;
5. preserve unrelated valid artifacts/evidence and report what changed.

Use the deep path for a new artifact, unclear scope or contradictory evidence, public API/event/schema changes, persisted data/migrations, authentication/authorization/secrets/signing/trust boundaries, deployment/rollback/availability risk, cross-provider dependency restructuring, unhealthy or unfamiliar conventions, missing durable required evidence, or a failed invariant that invalidates reused evidence. Load the references/checklists needed by those triggers and retain all required safety validation.

## Discover

Inspect actual repository/system state before changing it. Locate authoritative artifacts/evidence and identify affected standards, constraints, supported platforms, integrations, and user requirements. Expand context when a dependency, uncertainty, or deep-path trigger requires it.

## Decide

Select the smallest strategy that satisfies the capability. Preserve healthy existing standards. Do not infer policy from the author's workspace.

## Implement

Apply only authorized changes. Keep domain semantics independent from unrelated tooling.

## Validate

Run capability-appropriate checks and verify changed state. Reuse evidence only when it is durable, inspectable evidence of actual execution/observation with an identifiable candidate, checked surface, relevant inputs/environment, and outcome. Independently establish that it satisfies the gate being owned; prose claims or recollection are not execution evidence.

A later mutation invalidates the checks whose coverage or inputs it affects. Rerun those checks and mandatory related invariants; preserve unaffected valid evidence. Reuse expensive runtime verification across an unchanged candidate and relevant environment. A new turn/session alone does not invalidate evidence. Execute or observe relevant checks when required evidence cannot be inspected or established. Skipped/unavailable checks are not PASS.

## Report

Report current state, source candidate, affected surface, decisions, changes, and exact usage/maintenance commands. Distinguish reusable evidence, invalidated evidence, freshly established evidence, and assumptions/inferences that are not evidence. Include remaining risks and uncertainties.

## Detailed references

Add focused files under `references/` only when more detail is needed and give each reference a concrete scope/risk/ambiguity load trigger. Load triggered safety references; a bounded amendment does not require every reference or full template replay. Add scripts/assets only when they materially improve deterministic execution.
