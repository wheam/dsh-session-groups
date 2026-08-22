# Security Policy

## Supported versions

Security fixes are provided for the latest published release.

| Version | Supported |
| --- | --- |
| `0.1.x` | Yes |
| Older versions | No |

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability.

Use GitHub's private vulnerability reporting flow:

<https://github.com/wheam/dsh-session-groups/security/advisories/new>

Include the affected version, impact, reproduction steps, and any suggested mitigation. Remove credentials, private conversation content, local paths, and Session data from reports.

You should receive an acknowledgement within seven days. A fix timeline depends on severity and on whether the issue is in this plugin or the rapidly evolving DeepSeek Harness APIs.

## Security scope

The plugin stores virtual-group assignments in DSH's local `session_groups` storage domain and reads local Session/Workspace projections for sidebar rendering. It does not intentionally access credentials, conversation contents, external services, or the network.

Like every in-process DSH plugin, it runs with the permissions of the DSH process. Users should review source code and install a pinned release from a repository they trust.
