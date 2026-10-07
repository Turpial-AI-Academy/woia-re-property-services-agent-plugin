# AGENTS.md

## Repository purpose

Canonical source of the portable `woia-re-property-services` Agent Plugin.

## Capability rules

1. Follow the WOIA Agent Plugin Standard.
2. Keep the portable capability self-contained and independent from authoring tooling.
3. Use DISCOVER -> DECIDE -> IMPLEMENT -> VALIDATE -> REPORT.
4. Audit existing/production repositories before editing and preserve healthy standards.
5. Do not encode the author's workspace as a universal requirement.
6. Keep `SKILL.md` focused and use progressive disclosure.
7. Do not add MCP without a demonstrated capability need.
8. Do not require ASPS for standalone operation.
9. Use minimum-sufficient-evidence: a healthy authoritative artifact and understood local change allow a bounded amendment; uncertainty, contract/persistence/security boundaries, deployment/rollback risk, or missing required evidence require deeper handling.
10. Load detailed references by scope/risk trigger. Preserve unaffected valid artifacts/evidence and independently inspect durable evidence before reusing it for a gate. Report reusable, invalidated, freshly established, and assumptions/inferences that are not evidence.

## Maintenance

1. `package.json` is canonical for maintenance Node/pnpm versions.
2. Mise tasks invoke Node scripts directly.
3. `pnpm-workspace.yaml` keeps `verifyDepsBeforeRun: error`.
4. Bootstrap is the explicit dependency-install boundary.
5. If an optional checksum manifest is retained, regenerate it after portable payload changes; it is not a release gate.
6. Run `ci:fast` before finishing implementation.
7. Run clean-Linux container parity when maintenance portability changes; use the configured `WOIA_CONTAINER_ENGINE` rather than hard-coding a paid/vendor-specific service.
8. Run `release:check` only against a committed exact candidate.
9. Do not move published tags.

## Safety

Do not push, tag, publish, deploy, or update marketplace without authorization.
