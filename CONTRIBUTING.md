# Contributing

Changes must preserve the WOIA Agent Plugin Standard and keep capability-specific policy out of generic authoring infrastructure.

Before adding a universal rule, ask whether it is truly cross-plugin or belongs only to this capability.

## Setup

~~~text
mise install
mise run bootstrap
~~~

## Validation

~~~text
mise run doctor
mise run ci:fast
mise run ci:extended
~~~

If retaining the optional `CHECKSUMS.sha256` manifest, regenerate checksums after portable payload changes.

Before a release candidate, commit the intended bytes and run `mise run release:check`.

Do not publish, tag, or update the marketplace without authorization.
