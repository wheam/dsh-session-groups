# dsh-session-groups

Provider-owned virtual session groups for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web sidebar.

Channel plugins can group Sessions by a stable provider identity while leaving Session working directories, Workspace records, and conversation logs unchanged. Real Workspaces, virtual groups, and remaining ungrouped Sessions are rendered in one sidebar.

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

The same `source + id` identifies one group. The newest assignment controls its title. Providers can remove an assignment with `await ctx.sessionGroups.unassign(sessionId)`.

Installing this package adds the service and sidebar UI; virtual groups appear after a provider uses this API.

## Data and compatibility

- Stores assignments in the local DSH `session_groups` storage-domain sidecar.
- Makes no external network requests and reads no credentials.
- Does not change model input, tools, prompts, or Session logs.
- Verified with DSH `0.1.1-rc.2` on the Web client.

This release shadows the complete `sidebar.workspaces` surface. It preserves common Workspace and Session actions and title search, but does not reproduce full conversation-content search or drag sorting from the stock browser.

## License

MIT
