# Security

The plugin package must not contain credentials, usable secrets, or author-machine private state.

## Baseline

- secrets stay outside Git and portable package data;
- portable paths remain inside the plugin root;
- reasonably textual portable files are scanned for secret-like material;
- release archives are verified against exact checksums;
- third-party runtime/tool dependencies must be justified and documented.

Report sensitive vulnerabilities privately through the repository's GitHub security mechanism when available.
