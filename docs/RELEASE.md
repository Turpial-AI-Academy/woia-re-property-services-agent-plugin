# Release procedure

## 1. Prepare

- update `plugin.json.version`;
- update `package.json.version`;
- add the matching first changelog heading;
- regenerate portable checksums only if retaining that optional source diagnostic;
- run normal and extended gates as appropriate.

## 2. Commit exact candidate

~~~text
git add .
git commit -m "release: woia-re-property-services vX.Y.Z"
~~~

## 3. Exact candidate gate

~~~text
mise run release:check
~~~

The gate requires a clean tree and validates the archive generated from HEAD.

## 4. Factory publication

From the canonical `woia-ecosystem` repository, use `plugin:release-prepare` to prepare exact-candidate release evidence and `plugin:release-publish` for read-only preflight.

Only after explicit maintainer authorization bound to that evidence, use the Factory's publication or recovery mode. Follow the [Plugin Release Publication Contract](https://github.com/Turpial-AI-Academy/woia-ecosystem/blob/main/standards/PLUGIN_RELEASE_PUBLICATION_CONTRACT.md).

The Factory owns immutable tag, Release and asset publication. It does not push or authorize source-branch changes. Never move a published tag.

## 5. Marketplace

Only after the tag/release exists, follow the Marketplace Admission Contract.
