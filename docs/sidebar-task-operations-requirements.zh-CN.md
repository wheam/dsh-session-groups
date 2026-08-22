# 左侧栏任务运营能力需求

- 状态：已确认方向，尚未开始实现
- 调研与需求基线：2026-08-23
- 适用范围：`dsh-session-groups` Web 左侧栏

## 1. 背景

`dsh-session-groups` 已经能把真实 DSH Workspace、Provider 管理的虚拟分组和未分组 Session 合并到同一个左侧栏，并保留常用的 Session 与 Workspace 操作。

当前左侧栏主要解决“会话属于哪里”的问题，但还没有充分解决“现在最需要处理哪个任务”“怎样快速找到旧任务”“怎样管理大量历史任务”等问题。随着飞书、Slack、Telegram 等渠道持续创建 Session，左侧栏需要从静态会话目录升级为轻量的任务运营入口。

本需求的产品方向是：

> 渠道分组目录 + 任务状态收件箱

## 2. 调研结论

### 2.1 OpenAI Codex / ChatGPT Desktop

OpenAI 的 Projects 视图把项目、Chats、文件、连接来源和项目说明放在同一上下文中。项目和 Chat 支持置顶、重命名、搜索、归档与恢复；搜索可以根据记得的短语或分支名找回过去的 Chat。

Activity 视图集中展示未读、运行中和等待用户响应的任务。Scheduled 视图还会区分活跃、暂停和已完成任务，并展示最近运行记录。

可借鉴点：

- 项目与会话两级置顶。
- 标题搜索与对话正文搜索结合。
- 把“需要关注的任务”从普通目录中提炼出来。
- 归档不是消失，而是可以管理和恢复。
- 后台任务拥有独立状态入口。

资料：

- [Projects and chats](https://learn.chatgpt.com/docs/projects)
- [Notifications and Activity](https://learn.chatgpt.com/docs/notifications)
- [Scheduled tasks](https://learn.chatgpt.com/docs/automations)

### 2.2 腾讯 WorkBuddy

WorkBuddy 左侧栏分为最近任务和按工作空间组织的空间。任务卡片会显示标题、状态、更新时间；列表支持标题搜索、状态筛选和日期筛选。文档列出的状态包括规划中、进行中、待处理、已完成、失败和已归档。

常用操作包括置顶、打开任务文件夹和重命名。执行中的任务会持续出现在左侧栏，因此用户可以在多个并行任务之间切换并观察进度。

可借鉴点：

- 状态和更新时间直接进入列表行，而不是必须打开任务后才能判断。
- “待处理”与“进行中”分开，体现是否需要用户动作。
- 搜索和筛选放在同一入口。
- 打开任务目录属于高频操作。
- 最近任务和项目空间可以使用不同浏览视角。

资料：

- [任务管理](https://www.workbuddy.cn/docs/workbuddy/Task-Management)
- [新建任务栏（本地 AI 工作台）](https://cloud.tencent.cn/document/product/1831/134391)

### 2.3 GitHub Copilot App

Copilot App 把活跃 Agent Session 按 Repository 分组。Session 可以运行在独立 worktree、本地目录或云沙箱中，多个 Session 能并行执行。普通 Chats 与拥有工作分支或工作树的 Agent Sessions 分开显示。

管理页支持搜索、筛选、多选归档、多选删除、恢复已归档 Chat，并能查看工作文件和聊天记录的磁盘占用。

可借鉴点：

- 活跃 Agent 与普通对话可以有不同信息密度。
- 管理大量历史任务时使用独立管理页，而不是把所有操作塞进窄侧栏。
- 批量管理、归档恢复和资源占用是历史增长后的必要能力。
- Repository/Workspace 是稳定的一级分组轴。

资料：

- [Working with agent sessions in the GitHub Copilot app](https://docs.github.com/en/copilot/how-tos/github-copilot-app/agent-sessions)

### 2.4 Cursor

Cursor 的普通历史会话支持打开、重命名、删除和导出 Markdown，还可以把过去的 Chat 作为新 Chat 的上下文。后台 Agent 使用独立入口，支持搜索、查看状态、追加指令和接管。

可借鉴点：

- 后台 Agent 状态不应混成无差别的历史记录。
- 搜索结果可以继续成为新任务的上下文。
- 本地历史和远端后台任务可以共享导航习惯，但保留不同生命周期。

资料：

- [Chat history](https://docs.cursor.com/en/agent/chat/history)
- [Background agents](https://docs.cursor.com/background-agent)

### 2.5 行业共识

综合以上产品，成熟 Agent 客户端的侧栏通常同时承担以下职责：

1. 按项目、工作区、渠道或代码仓库组织任务。
2. 区分运行中、等待用户、刚完成、失败和空闲等状态。
3. 同时提供标题搜索和对话正文搜索。
4. 提供置顶、归档、恢复和批量清理等生命周期管理。
5. 为后台任务提供 Activity 或 Inbox，而不是要求用户逐一打开检查。
6. 在多任务并行时提示用户下一步最应该关注哪个任务。

## 3. 当前能力基线

截至本需求记录时，当前工作区实现已经具备：

- 使用 `source + id` 作为稳定、与渠道实现无关的虚拟分组身份。
- 合并展示真实 Workspace、Provider 虚拟分组和未分组 Session。
- 展示常见消息渠道的来源图标与来源标签。
- 展示群聊、话题群等 Provider 类型标签。
- 展示分组内 Session 数量。
- 展开和收起分组。
- 按 Session 标题、分组标题、来源和已知分组类型进行本地搜索。
- 高亮当前 Session。
- 使用状态点标记正在运行的 Session。
- 打开、新建、重命名、分叉和归档 Session。
- 添加、重命名和删除 Workspace。
- Provider 分组接口不可用时保留最近成功快照并降级展示本地 Session。

当前已知限制：

- 没有对话正文全文搜索。
- 没有拖拽排序。
- 只展示“运行中”状态，没有等待用户、刚完成和后台 Job 失败状态。
- 没有状态、日期和来源筛选。
- 没有置顶或收藏。
- 分组折叠和浏览偏好不会持久保存。
- 归档后从主列表消失，没有归档管理和恢复入口。
- 没有打开 Workspace 文件夹的快捷操作。
- 没有更新时间、目录或 Agent preset 等辅助信息。
- 没有批量管理。
- Subagent 和后台 Job 没有进入导航层。
- 分组只显示总数，没有聚合“待处理”“运行中”等状态数量。

## 4. 产品目标

### 4.1 主要目标

- 用户不打开 Session，也能判断任务当前状态和是否需要自己处理。
- 用户可以通过标题或对话正文快速找回过去的 Session。
- 用户可以快速定位高频任务、运行中任务和刚完成任务。
- 在保持 Provider 分组语义的同时，允许用户保存自己的浏览偏好。
- Session 数量增长后，归档、排序和批量管理仍然可用。
- UI 保持紧凑，不把窄侧栏变成信息拥挤的仪表盘。

### 4.2 非目标

首轮不包括：

- 新建 Scheduled/Automation 后端。
- 跨设备同步侧栏偏好。
- 云沙箱或远程 worktree 管理。
- 会话分享、多人协作或团队权限。
- 修改模型 Prompt、工具集、对话内容或 Session 工作目录。
- 允许用户修改 Provider 拥有的分组身份和归属关系。

## 5. 信息架构

建议的默认布局：

```text
会话                                      ＋
[ 搜索标题或对话正文  Cmd/Ctrl+K ]  [筛选]

[待我处理 2] [运行中 3] [刚完成 1]

★ 已置顶
  修复登录问题                         等待审批

▾ Curio 作战室 · 飞书话题群          8  待处理 2
  明天探报复查                         已完成
  排查数据源                           运行中

▾ dsh-session-groups                  5
  丰富左侧目录栏                       3 分钟前

归档与管理
```

默认仍以 Workspace、Provider 虚拟分组和未分组 Session 为主体。“待我处理”“运行中”“刚完成”是快捷筛选，不复制或改变 Session 归属。

## 6. 状态模型

### 6.1 Session 状态

首轮状态定义：

| 状态 | 数据来源 | 展示建议 | 用户含义 |
| --- | --- | --- | --- |
| 等待用户 | `pendingInteraction` | 琥珀色状态点或徽标 | 等待审批、计划审核或回答问题 |
| 后台任务失败 | `jobsBySession[].status === "failed"` | 红色状态点或错误标记 | 至少一个后台 Job 失败，需要查看 |
| 运行中 | `running` 或存在运行中 Job | 蓝色动态或实心状态点 | Agent 或后台任务正在工作 |
| 刚完成 | `completed` | 绿色状态点 | 未选中期间完成，用户尚未打开查看 |
| 空闲 | 以上均不成立 | 不显示状态点 | 当前没有需要关注的活动 |

当多个状态同时存在时，首轮采用以下显示优先级：

1. 等待用户
2. 后台任务失败
3. 运行中
4. 刚完成
5. 空闲

列表行只展示一个主状态；后台 Job 数量和详细状态可在 tooltip、二级信息或后续展开视图中补充。

### 6.2 分组状态

分组标题保持 Session 总数，同时允许展示非零的关注数量：

- 待用户处理数量。
- 运行中数量。
- 刚完成数量。
- 后台 Job 失败数量。

空计数不展示。搜索或筛选生效时，总数口径仍使用分组完整可见 Session 数量，筛选命中数另行显示，避免用户误以为 Session 被删除。

## 7. 分阶段需求

### 7.1 P0：任务状态与检索闭环

P0 是第一轮实现范围。

#### P0-1 完整状态展示

需求：

- Session 行支持等待用户、后台 Job 失败、运行中、刚完成和空闲状态。
- 状态提供颜色之外的可访问名称和 tooltip。
- 当前选中行与状态标记可以同时识别。
- 分组标题聚合重要状态数量。

验收标准：

- 等待审批、计划审核或问题回答的 Session 会进入“待我处理”。
- Session 在未选中期间完成后显示“刚完成”，打开后由 DSH 原有状态机制清除。
- 运行中 Session 和运行中后台 Job 均可被发现。
- 后台 Job 失败不会被绿色完成状态覆盖。

#### P0-2 快捷筛选

需求：

- 搜索栏下方提供“待我处理”“运行中”“刚完成”“全部”快捷筛选。
- 快捷筛选显示跨分组数量。
- 支持状态、来源和更新时间范围的详细筛选面板。
- 清空筛选后恢复原分组结构和排序。

验收标准：

- 用户最多两次点击即可只查看所有待响应 Session。
- 筛选不会修改 Session 分组或归档状态。
- 没有命中时显示明确空状态及“清除筛选”操作。

#### P0-3 标题与正文统一搜索

需求：

- 输入时先即时匹配 Session 标题、分组标题、来源和类型。
- 非空查询经过短防抖后调用 DSH `sessions.search()` 查询对话正文。
- 正文命中展示 Session 标题、所属分组和命中片段。
- 新查询取消上一次尚未完成的请求。
- 搜索失败时保留本地标题搜索结果，并提供非阻塞错误提示。
- 提供 `Cmd/Ctrl+K` 聚焦搜索框。

验收标准：

- 只记得历史对话中的短语时，可以找到对应 Session。
- 搜索过程中不会修改 Session 列表快照。
- 快速连续输入不会产生乱序覆盖。
- 搜索结果可以直接打开对应 Session。

#### P0-4 时间与辅助信息

需求：

- Session 行在空间允许时展示相对更新时间。
- 完整更新时间、`cwd`、Agent preset 和来源放入 tooltip 或详情菜单，避免常驻信息过多。
- 虚拟分组仍优先展示 Provider 来源和类型。

验收标准：

- 用户可以区分刚更新和长期未更新的同名任务。
- 窄栏中标题仍保留主要宽度，不因元数据严重截断。

#### P0-5 打开 Workspace 文件夹

需求：

- 真实 Workspace 菜单增加“打开文件夹”。
- 调用 DSH `workspaces.openPath()`，不自行执行平台相关命令。
- 虚拟 Provider 分组没有真实 Workspace 路径时不展示该操作。

验收标准：

- 操作只打开目录，不修改文件和 Workspace 注册。
- 打开失败时使用现有非阻塞操作错误区域反馈。

#### P0-6 浏览偏好持久化

需求：

- 保存分组折叠状态、当前排序方式和最后使用的筛选视角。
- 搜索查询默认不跨重启保存。
- 偏好与 Provider 分组 assignment 分开存储。
- 已不存在的分组偏好可以安全忽略或按策略清理。

验收标准：

- 页面刷新后，分组折叠状态和排序偏好仍然存在。
- Provider 修改分组标题不会破坏以稳定分组 key 保存的偏好。
- 偏好损坏或读取失败时可以降级为默认布局。

### 7.2 P1：高频任务与历史管理

#### P1-1 置顶与收藏

- 支持置顶真实 Workspace、虚拟分组和 Session。
- 置顶只改变导航位置，不改变 Session 上下文或 Provider assignment。
- 同一层级内置顶项保持稳定次序。
- 置顶偏好存储在插件自己的用户偏好域。

#### P1-2 排序与拖拽

- 提供最近更新、名称、状态和手动排序。
- 真实 Workspace 拖拽使用 DSH `workspaces.insertBefore()`。
- 真实 Workspace 内 Session 拖拽使用 `workspaces.insertSessionBefore()`。
- 虚拟分组及其 Session 的手动顺序属于插件偏好，不改写 Provider assignment。
- 搜索或状态筛选期间默认禁用拖拽，避免排序目标不明确。

#### P1-3 归档与管理

- 增加“归档与管理”入口，使用独立面板而不是长期占用侧栏。
- 支持查看已归档 Session、搜索、筛选、恢复和删除。
- 支持多选归档、恢复和删除。
- 删除必须明确区分“从列表归档”“删除 Session 记录”“删除 Workspace 注册”。
- 若当前 DSH Runtime 未暴露恢复或永久删除 API，需要先补齐 Host/Runtime 能力，不以直接写存储替代。

#### P1-4 统一上下文菜单

- Session 菜单包含打开、重命名、分叉、置顶和归档。
- 真实 Workspace 菜单包含新建 Session、打开文件夹、重命名、置顶和删除注册。
- 高风险操作需要确认，普通操作不使用阻塞式二次确认。

### 7.3 P2：Agent 活动与规模化管理

- 展开 Session 查看 Subagent 和后台 Job。
- 展示 Job 类型、标签、状态、运行时长及失败详情。
- 增加独立 Activity 入口，集中展示跨分组的待响应、失败、运行中和刚完成任务。
- 支持完整键盘导航、快捷打开和上下移动。
- 支持批量归档、删除和其他适合批处理的动作。
- DSH 将来提供自动任务后，再评估 Scheduled 分区；本项目不在当前阶段自行实现调度系统。

## 8. 数据与实现边界

### 8.1 可直接消费的 DSH 数据

当前 DSH Client Runtime 已提供：

| 能力 | 现有数据或 API |
| --- | --- |
| 正在运行 | `SessionSummary.running` |
| 等待用户 | `SessionSummary.pendingInteraction` |
| 刚完成未查看 | `SessionSummary.completed` |
| 更新时间 | `SessionSummary.updatedAt` |
| 工作目录 | `SessionSummary.cwd`、`WorkspaceView.path` |
| Agent preset | `SessionSummary.agentPreset` |
| 后台任务 | `SessionListState.jobsBySession` |
| 对话正文搜索 | `ctx.sessions.search()` |
| 打开目录 | `ctx.workspaces.openPath()` |
| Workspace 排序 | `ctx.workspaces.insertBefore()` |
| Workspace 内 Session 排序 | `ctx.workspaces.insertSessionBefore()` |

因此 P0 的状态、全文搜索、时间信息和打开文件夹原则上不需要新增 Host 数据模型。

### 8.2 Provider 所有权

- `source + id` 继续作为 Provider 分组稳定身份。
- Provider 继续拥有分组标题、来源、类型和 Session assignment。
- 用户置顶、折叠、排序和筛选偏好是展示层数据，不写回 Provider assignment。
- 虚拟 assignment 继续优先于真实 Workspace 的展示归属。
- Provider 最新 descriptor 仍决定同一稳定分组的显示名称和类型。

### 8.3 数据安全

- 不修改 Prompt、模型消息、Session 日志或工作目录。
- 全文搜索只调用 DSH 已有本地索引接口，不由插件建立第二份对话索引。
- 偏好数据不得包含对话正文、凭据或外部服务 Token。
- 插件自身继续不发起外部网络请求。

### 8.4 降级策略

- Provider 分组接口失败：保留最近成功 assignment，继续显示本地 Session。
- 全文搜索失败：继续提供标题和分组元数据搜索。
- 偏好读取失败：使用默认折叠和排序，不影响 Session 打开。
- Job 数据不可用：退化到 Session 级运行状态，不显示虚假错误。
- 未知状态或未知 Provider kind：不向用户暴露内部原始枚举。

## 9. 交互与视觉原则

- 状态不能只靠颜色表达，必须有可访问名称或 tooltip。
- 每行只保留一个主状态，减少视觉噪声。
- 行内常驻信息优先级为：状态、标题、相对时间。
- 低频操作进入 hover 菜单或上下文菜单。
- 分组总数和状态计数口径必须稳定且可解释。
- 侧栏负责快速定位，复杂的归档和批量管理进入独立面板。
- 当前 Session 高亮、键盘焦点和 hover 状态必须能明确区分。
- 动画遵循系统减少动态效果设置。

## 10. P0 完成定义

只有同时满足以下条件，P0 才算完成：

1. 等待用户、后台 Job 失败、运行中、刚完成状态能正确显示和筛选。
2. 分组标题能聚合重要状态数量。
3. 标题搜索和 DSH 对话正文搜索在同一入口工作，并正确处理取消、失败和无结果。
4. Session 行能展示更新时间，辅助信息不会挤压主要标题。
5. 真实 Workspace 可以从菜单打开文件夹。
6. 折叠、排序和筛选视角按约定持久化。
7. Provider assignment、Session 日志、Prompt 和工作目录没有被修改。
8. 现有打开、新建、重命名、分叉、归档及 Workspace 操作没有回归。
9. 相关纯逻辑、状态派生、搜索竞态和偏好降级具备自动化测试。
10. README 的功能和限制说明与最终实现同步更新。

## 11. 后续实施顺序

建议实现顺序：

1. 抽离并测试 Session 主状态派生和分组状态聚合。
2. 增加状态标记与快捷筛选。
3. 接入全文搜索、取消和结果片段。
4. 增加更新时间与打开文件夹操作。
5. 增加浏览偏好存储与降级。
6. 完成可访问性、视觉和回归测试。
7. 更新 README，再进入 P1 设计与实现。

本文件记录已确认的产品需求和范围，不代表本次已经开始代码实现。
