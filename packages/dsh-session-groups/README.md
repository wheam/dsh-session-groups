# dsh-session-groups

`dsh-session-groups` 是一个面向 DeepSeek Harness `0.1.1-rc.2` 的通用虚拟会话分组插件。渠道插件通过 `ctx.sessionGroups.assign(sessionId, descriptor)` 发布分组；浏览器把真实 Workspace、虚拟分组和剩余未分组会话合并在同一个左栏中。

插件不认识飞书、Slack 或 Telegram 的业务字段，也不修改 Session `cwd`、Workspace 注册表或 Session 日志。分组关系存储在 DSH `storage-domain` 的 `session_groups` sidecar 中，并通过 Typert Remote 进入浏览器。

## Provider API

```ts
await ctx.sessionGroups.assign(sessionId, {
  id: providerStableGroupId,
  title: '与张三的私聊',
  source: 'feishu',
  kind: 'private',
})
```

相同 `source + id` 的 Session 会进入同一组。`title` 更新时，最新 assignment 的名称生效。Provider 创建 Session 失败时可以调用 `unassign(sessionId)` 清理预留关系。

## 安装与开发

```bash
cd /Users/wheam/Downloads/dsh-session-groups
pnpm install
pnpm run check
dsh plugin --profile web add link:/Users/wheam/Downloads/dsh-session-groups/packages/dsh-session-groups
```

安装后重启 `dsh web`。包内 `cordis.patch.yml` 会插入 `dsh-session-groups` Host 服务；`dsh.client` 清单会加载左栏浏览器。

## DSH 机制

- Host：Cordis `TypertRemoteService` + `storageDomain` KV sidecar。
- Client：`ctx.remote.$mount()` 加载生成的 Remote contribution。
- UI：在官方 `sidebar.workspaces` single slot 上注册 `priority: -100` 的 shadow entry；低 priority 优先渲染是 DSH Slot 的正式规则。
- Data：Provider 只提交通用的 `id/title/source/kind`，浏览器不包含渠道判断。

## 当前限制

该版本必须拥有整个 `sidebar.workspaces` surface，因此自己实现 Workspace/Session 列表。它保留打开、新建、重命名、分叉、归档、添加/重命名/删除 Workspace 和标题搜索；官方浏览器的正文全文搜索与拖拽排序尚未复刻。DSH 将来提供细粒度的虚拟分组 contributor slot 后，可以移除 shadow browser，只保留 sidecar service 和 provider API。

## Model Experience

无。插件只改变浏览器导航，不修改模型输入、工具、提示词或 Session 对话日志。

