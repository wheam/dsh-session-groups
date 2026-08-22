# dsh-session-groups

[简体中文](README.md)

[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek%20Harness-0.1.1--rc.2-4f46e5)](https://github.com/deepseek-ai/deepseek-harness)
[![CI](https://github.com/wheam/dsh-session-groups/actions/workflows/ci.yml/badge.svg)](https://github.com/wheam/dsh-session-groups/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](packages/dsh-session-groups/LICENSE)

Project/source task navigation for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web sidebar.

Channel plugins attach a stable communication origin such as a Feishu chat, Slack channel, or Telegram conversation. `dsh-session-groups` keeps that origin independent from the Session's Workspace or working directory, so a Feishu-created task still appears under its real project by default and can be reorganized by source when needed.

> Installing this plugin adds the origin service and sidebar UI. A channel/provider plugin must call the [Provider API](#provider-api) before external source metadata appears.

## Features

- Independent project and communication-source contexts for every Session.
- Project-first browsing by real Workspace, inferred directory project, or "No project"; source-first browsing by app and concrete chat.
- Project rows show origin metadata only for explicit channels; missing assignments stay quiet there and collect under "Unattributed" in source view.
- Durable, provider-neutral source assignments keyed by exact `source + id`, with presentation-only alias families such as Feishu/Lark.
- Built-in source icons and aliases for messaging channels plus coding agents including Claude Code, Codex, Cursor, GitHub Copilot, Gemini CLI, OpenCode, Windsurf, Cline, Continue, Aider, Kimi Code, Replit Agent, Amazon Q Developer, Tabnine, Cody, Roo Code, and Zed Agent.
- Waiting-user, failed-job, running, recently-completed, and idle status with group aggregation, quick filters, source/chat/date filters, and an Activity inbox.
- Unified title/metadata and DSH conversation-content search with snippets, cancellation, and `Cmd/Ctrl+K` focus.
- Exact update metadata in tooltips, project/source metadata, Workspace folder opening, pinning, four sort modes, and drag ordering.
- Archived-session browser, multi-select archive, Job/Subagent details, and keyboard up/down navigation.
- Existing Session and Workspace actions: open, create, rename, fork, archive, add, reorder, and delete registration.
- Browser preferences persist locally and degrade safely if storage is unavailable or corrupt.
- Local DSH storage only; no external network requests, credentials, model tools, or prompt changes.

## Install

Requirements: Node.js 22+, `pnpm`, and DeepSeek Harness `0.1.1-rc.2`.

Install the prebuilt release into the Web profile:

```bash
dsh plugin --profile web add https://github.com/wheam/dsh-session-groups/releases/download/v0.1.0/dsh-session-groups-0.1.0.tgz
```

Restart `dsh web` after installation. That is all that is required on the user side.

To install the current source version instead:

```bash
dsh plugin --profile web add 'github:wheam/dsh-session-groups#path:packages/dsh-session-groups'
```

The repository includes prebuilt runtime files, so the GitHub installation does not need an install-time build script.

### Update or remove

```bash
dsh plugin --profile web update dsh-session-groups
dsh plugin --profile web remove dsh-session-groups
```

Restart `dsh web` after either command.

## Provider API

Provider plugins attach one DSH Session to a communication source through the backwards-compatible `ctx.sessionGroups` API:

```ts
await ctx.sessionGroups.assign(sessionId, {
  id: providerStableGroupId,
  title: 'Chat with Zhang San',
  source: 'feishu',
  kind: 'private',
})
```

The assignment describes where the Session was initiated; it does not replace Workspace membership or `cwd`. Sessions with the same exact `source + id` are rendered under the same chat in source view. The newest assignment controls that chat's displayed title and kind. If a provider reserves an assignment but fails to create the Session, it can clean up with:

```ts
await ctx.sessionGroups.unassign(sessionId)
```

The service is added to the Cordis context through declaration merging, so TypeScript provider projects should depend on `dsh-session-groups` for its public types.

## How it works

```mermaid
flowchart LR
    P[Channel / provider plugin] -->|assign / unassign| S[sessionGroups service]
    S --> D[(storage-domain sidecar)]
    S --> R[Typert Remote]
    R --> B[Web project/source browser]
    W[DSH Workspaces, Sessions, status and search] --> B
```

- **Host:** a Cordis `TypertRemoteService` owns the provider-facing API.
- **Data:** communication-source assignments live in the `session_groups` storage-domain sidecar; project context remains owned by DSH Workspace and Session data.
- **Client:** a Typert Remote snapshot feeds source metadata into the Web sidebar; refreshes are coalesced and failures retain the last successful snapshot.
- **UI:** the plugin uses the official `sidebar.workspaces` slot priority mechanism to render project, source, Activity, and archive surfaces.

## Compatibility and limitations

| Item | Status |
| --- | --- |
| Verified DSH version | `0.1.1-rc.2` |
| Client | Web |
| Runtime | Node.js 22+ |
| Model experience | Unchanged |
| License | MIT |

DeepSeek Harness is in developer preview, so compatibility may break between release candidates. This version owns the complete `sidebar.workspaces` surface and reimplements the standard Workspace/Session list.

The verified DSH Runtime supports archiving but does not yet expose safe unarchive or permanent Session-delete APIs. Archived Sessions can be viewed, searched, and opened; restore and permanent deletion remain unavailable until those Runtime capabilities exist. Scheduled-task creation and cross-device preference sync are also outside this plugin's current scope.

## Data and permissions

- Writes only communication-source assignments to DSH's local `session_groups` storage domain and non-sensitive browser preferences to local storage.
- Reads local Session, Workspace, Job, Subagent, and Host search projections needed to render the sidebar.
- Conversation search uses DSH's existing local index and stores no second copy of message content.
- Does not modify prompts, model messages, Session logs, working directories, credentials, or external services.
- Makes no network requests of its own.

As with every in-process DSH plugin, the code runs with the permissions of the DSH process. Review third-party plugin source before installation.

## Development

```bash
git clone https://github.com/wheam/dsh-session-groups.git
cd dsh-session-groups
pnpm install
pnpm run check
```

For local development, link the package into the Web profile and restart DSH:

```bash
dsh plugin --profile web add "link:$PWD/packages/dsh-session-groups"
```

The `packages/typert-protocol-shim` workspace is build-only support for Typert symbol discovery in `0.1.1-rc.2`. Published runtime artifacts still reference the official `@deepseek-ai/dsh-typert-protocol` package.

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution instructions and [SECURITY.md](SECURITY.md) for private vulnerability reporting.

## License

[MIT](packages/dsh-session-groups/LICENSE)
