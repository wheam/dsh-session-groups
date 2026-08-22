# dsh-session-groups

Project/source task navigation for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web sidebar.

Channel plugins attach a stable communication origin while project membership remains owned by DSH Workspace and `cwd` data. The sidebar can switch between project and source views and includes status filters, conversation search, Activity, archive browsing, pinning, sorting, drag ordering, Job/Subagent details, and batch archive.

Full documentation: [github.com/wheam/dsh-session-groups](https://github.com/wheam/dsh-session-groups#readme)

## Install

Requires Node.js 22+, `pnpm`, and DeepSeek Harness `0.1.1-rc.2`.

```bash
dsh plugin --profile web add https://github.com/wheam/dsh-session-groups/releases/download/v0.1.0/dsh-session-groups-0.1.0.tgz
```

Restart `dsh web` after installation.

Source install:

```bash
dsh plugin --profile web add 'github:wheam/dsh-session-groups#path:packages/dsh-session-groups'
```

## Provider API

```ts
await ctx.sessionGroups.assign(sessionId, {
  id: providerStableGroupId,
  title: 'Chat with Zhang San',
  source: 'feishu',
  kind: 'private',
})
```

The same exact `source + id` identifies one communication source. The newest assignment controls its chat title and kind without replacing Workspace membership. Providers can remove an assignment with `await ctx.sessionGroups.unassign(sessionId)`.

Installing this package adds the service and sidebar UI; external source metadata appears after a provider uses this API.

## Data and compatibility

- Stores source assignments in the local DSH `session_groups` storage-domain sidecar and non-sensitive browser preferences in local storage.
- Makes no external network requests and reads no credentials.
- Uses DSH's local search API and does not keep a second conversation-content index.
- Does not change model input, tools, prompts, Session logs, or working directories.
- Verified with DSH `0.1.1-rc.2` on the Web client.

This release shadows the complete `sidebar.workspaces` surface. DSH `0.1.1-rc.2` exposes archive but not safe unarchive or permanent Session deletion, so archived Sessions can be viewed, searched, and opened but not restored or permanently deleted from this UI.

## License

MIT
