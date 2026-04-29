# Security policy

## Supported versions

| Version   | Supported |
| --------- | --------- |
| 1.x       | Yes       |
| Pre-1.0   | No        |

## Reporting a vulnerability

Please report security issues **privately** so we can fix them before public disclosure.

**Preferred:** [GitHub Security Advisories](https://github.com/gashiartim/minipad/security/advisories/new) for this repository.

**Email:** artimgashi.dev@gmail.com (include “minipad” in the subject). Allow a few business days for an initial response.

Please do not open a public issue for undisclosed security vulnerabilities.

## Threat model (brief)

MiniPad is intended to run **on your own machine or trusted LAN**: notes, optional note passwords, and uploaded images are stored locally (SQLite or your Postgres) and synced between browsers via **Socket.io** on the same origin. Treat the host like any other service on your network: anyone who can reach the URL can attempt to read unprotected notes or abuse the API; note secrets protect **writes** and uploads, not necessarily hiding that a slug exists. Do not expose an instance to the open internet without additional hardening (TLS, auth, network controls) that this project does not provide out of the box.
