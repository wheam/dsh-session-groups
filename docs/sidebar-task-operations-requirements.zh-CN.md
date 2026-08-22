# 左侧栏任务运营能力需求

- 状态：已确认方向，尚未开始实现
- 调研与需求基线：2026-08-23
- 适用范围：`dsh-session-groups` Web 左侧栏

## 1. 背景

`dsh-session-groups` 已经能把真实 DSH Workspace、Provider 管理的虚拟分组和未分组 Session 合并到同一个左侧栏，并保留常用的 Session 与 Workspace 操作。

当前左侧栏主要解决“会话属于哪里”的问题，但现有实现把“在哪个项目中工作”和“从哪个聊天发起”压成了同一个互斥分组。Provider assignment 会覆盖真实 Workspace 展示，因此一个在 `dsh-session-groups` 项目目录中执行、但由飞书话题群发起的 Session，只会出现在飞书群聊下。这会让渠道来源错误地取代任务的项目上下文。

项目归属和消息来源是两个正交属性：

- 项目归属回答“代码或文件在哪个目录、任务属于哪个 Workspace”。
- 消息来源回答“任务从哪个客户端、群聊、话题或私聊发起”。

除此之外，当前左侧栏还没有充分解决“现在最需要处理哪个任务”“怎样快速找到旧任务”“怎样管理大量历史任务”等问题。随着飞书、Slack、Telegram 等渠道持续创建 Session，左侧栏需要从静态会话目录升级为轻量的任务运营入口。

本需求的产品方向是：

> 项目/来源双轴目录 + 任务状态收件箱

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

1. 使用项目、Workspace 或代码仓库表达工作上下文，使用渠道和具体聊天表达发起来源；两者可以切换浏览，但不应互相覆盖。
2. 区分运行中、等待用户、刚完成、失败和空闲等状态。
3. 同时提供标题搜索和对话正文搜索。
4. 提供置顶、归档、恢复和批量清理等生命周期管理。
5. 为后台任务提供 Activity 或 Inbox，而不是要求用户逐一打开检查。
6. 在多任务并行时提示用户下一步最应该关注哪个任务。

## 3. 当前能力基线

截至本需求记录时，当前工作区实现已经具备：

- 使用 `source + id` 作为稳定、与渠道实现无关的虚拟分组身份。
- 合并展示真实 Workspace、Provider 虚拟分组和未分组 Session。
- 当前采用“Provider 虚拟 assignment 优先于真实 Workspace”的互斥分组规则。
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
- 项目归属和渠道来源共用一个分组维度，飞书等 Provider assignment 会遮蔽 Session 的真实 Workspace。
- 无法在“按项目工作”和“按来源追踪”之间切换浏览。
- 项目视图中无法直接看出 Session 来自哪个聊天，来源视图中也无法直接看出它操作哪个项目。
- “未分组”同时可能被理解为没有项目或没有渠道来源，语义不明确。

## 4. 产品目标

### 4.1 主要目标

- 用户不打开 Session，也能判断任务当前状态和是否需要自己处理。
- 用户可以通过标题或对话正文快速找回过去的 Session。
- 用户可以快速定位高频任务、运行中任务和刚完成任务。
- 默认按本地项目或目录组织任务，不再让渠道来源覆盖项目归属。
- 用户可以切换为来源视图，先查看飞书、Slack、Telegram 等渠道，再按群聊、话题或私聊查看 Session。
- 每个 Session 同时保留项目上下文和来源上下文，并在另一视图中显示对侧属性。
- 在保持 Provider 来源语义的同时，允许用户保存自己的浏览偏好。
- Session 数量增长后，归档、排序和批量管理仍然可用。
- UI 保持紧凑，不把窄侧栏变成信息拥挤的仪表盘。

### 4.2 非目标

首轮不包括：

- 新建 Scheduled/Automation 后端。
- 跨设备同步侧栏偏好。
- 云沙箱或远程 worktree 管理。
- 会话分享、多人协作或团队权限。
- 修改模型 Prompt、工具集、对话内容或 Session 工作目录。
- 允许用户修改 Provider 拥有的来源、聊天身份或聊天类型。
- 根据聊天标题猜测群聊、私聊或项目归属。

## 5. 信息架构

### 5.1 会话双轴模型

每个 Session 同时拥有两类互不覆盖的上下文：

| 维度 | 回答的问题 | 主要数据 | 稳定身份 | 缺失时的语义 |
| --- | --- | --- | --- | --- |
| 项目上下文 | 在哪里做事、属于哪个项目 | `WorkspaceView.sessionIds`、`WorkspaceView.path`、`SessionSummary.cwd` | 优先使用 `workspaceId`，否则使用规范化目录路径 | `无项目` |
| 来源上下文 | 从哪里发起、在哪个聊天中继续 | Provider assignment 的 `source`、`id`、`title`、`kind` | `source + id` | `本地或未标注来源` |

关键约束：

- Provider assignment 只描述来源上下文，不再拥有或覆盖项目归属。
- Workspace membership 或 `cwd` 只描述项目上下文，不会抹掉飞书等来源信息。
- 同一 Session 在任一视图内只出现一次，但切换视图后可以按另一维度重新组织。
- 切换视图只改变导航投影，不迁移 Session、不修改工作目录，也不写回 Provider assignment。

### 5.2 项目上下文解析

按以下优先级为每个 Session 解析一个项目上下文：

1. Session 已列入某个 `WorkspaceView.sessionIds` 时，以该 Workspace 为权威项目归属。
2. 没有显式 membership，但 `cwd` 位于某个已注册 Workspace 路径内时，使用路径边界安全的最长前缀匹配，归入最具体的 Workspace。
3. 没有匹配 Workspace 但存在 `cwd` 时，按规范化 `cwd` 形成只读的“目录项目”；它不是 Workspace 注册，也不获得重命名、删除注册或手动排序等 Workspace 操作。
4. `cwd` 也缺失时，归入 `无项目`。

路径比较必须尊重平台路径边界和大小写规则，不能用普通字符串 `startsWith` 把 `/foo/bar2` 误归入 `/foo/bar`。若异常数据让同一 Session 显式出现在多个 Workspace 中，应使用稳定、可测试的冲突规则并记录诊断，而不是重复展示。

`无项目` 只表示缺少项目上下文；其中的 Session 仍然可以来自飞书群聊、Slack 私聊或其他渠道。

### 5.3 来源上下文解析

来源上下文继续使用现有 Provider assignment：

- `source` 表示飞书、Slack、Telegram 等客户端或渠道。
- `source + id` 表示该渠道内的稳定聊天身份。
- `title` 是群聊、话题或私聊的展示名称。
- `kind` 表示 `group`、`topic`、`private` 等 Provider 明确提供的聊天类型。

为满足“查看某个聊天软件的全部会话”，展示层可以把 `feishu`、`lark` 等已知别名规范化为同一个来源家族，用于一级分组、图标和筛选；聊天的稳定身份仍使用 Provider 提供的原始 `source + id`，规范化不能改写存储或意外合并两个聊天。

未提供 assignment 的 Session 进入 `本地或未标注来源`，不能武断断言一定由本地 UI 创建。这类 Session 直接列在该来源桶下，不伪造具体聊天层级。未知 `kind` 原样保留内部语义但不展示未经产品定义的枚举；不得根据标题猜测聊天类型。

### 5.4 两种浏览视图

侧栏提供持久化的顶层视图切换：

- `按项目`：默认视图。一级按真实 Workspace、目录项目和 `无项目` 组织；Session 行显示紧凑来源标识，例如“飞书 · Curio 作战室”。
- `按来源`：一级按飞书、Slack、Telegram、`本地或未标注来源` 组织，二级按具体群聊、话题或私聊组织；Session 行显示项目或目录标识，例如“dsh-session-groups”。

“来源筛选”和“按来源视图”用途不同：

- 在项目视图选择“来源：飞书”，是在原项目结构中只看飞书发起的 Session。
- 切换到来源视图，是把 Session 重新按渠道与具体聊天组织，用于浏览某个聊天软件或聊天中的全部任务。
- 快捷操作“查看来自此来源的全部会话”“查看此聊天的全部会话”可以切换到来源视图并带入对应范围；清除范围后仍保留来源视图。

搜索结果、Activity 和归档管理应同时展示项目与来源，不能让用户靠当前视图猜测另一个维度。

### 5.5 建议布局

默认项目视图：

```text
会话                                      ＋
[ 搜索标题或对话正文  Cmd/Ctrl+K ]  [筛选]
[ 按项目 ] [ 按来源 ]

[待我处理 2] [运行中 3] [刚完成 1]

★ 已置顶
  修复登录问题            飞书 · 产品讨论群  等待审批

▾ dsh-session-groups                         5  待处理 2
  丰富左侧目录栏          飞书 · Curio 作战室  3 分钟前
  修复分组逻辑            本地或未标注来源     运行中

▾ 无项目                                    2
  回答群内问题              飞书 · 临时讨论群

归档与管理
```

切换到来源视图：

```text
[ 按项目 ] [ 按来源 ]

▾ 飞书                                      10
  ▾ Curio 作战室 · 话题群                    8
    丰富左侧目录栏          dsh-session-groups  3 分钟前
    明天探报复查            curio-ops           已完成
  ▾ 与张三的私聊                              2
    修复登录问题            web-console         等待审批

▾ 本地或未标注来源                           4
```

“待我处理”“运行中”“刚完成”是快捷筛选，不复制或改变 Session 的项目或来源属性。状态数量按当前可见视图聚合，切换视图不会改变跨 Session 的总计。

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

当前浏览视图的每一级分组标题保持 Session 总数，同时允许展示非零的关注数量：

- 待用户处理数量。
- 运行中数量。
- 刚完成数量。
- 后台 Job 失败数量。

项目视图按项目聚合，来源视图先按渠道、再按具体聊天聚合。空计数不展示。搜索或筛选生效时，总数口径仍使用分组完整可见 Session 数量，筛选命中数另行显示，避免用户误以为 Session 被删除。

## 7. 分阶段需求

### 7.1 P0：双轴导航、任务状态与检索闭环

P0 是第一轮实现范围。

#### P0-1 项目与来源双轴导航

需求：

- 为每个可见 Session 独立派生项目上下文和来源上下文，Provider assignment 不再从 Workspace 项目组中排除 Session。
- 默认使用“按项目”视图，并提供“按项目 / 按来源”顶层切换。
- 项目视图按真实 Workspace、目录项目和 `无项目` 分组，Session 行显示来源渠道和具体聊天。
- 来源视图先按渠道分组，再按 Provider 的具体群聊、话题或私聊分组，Session 行显示项目或目录。
- 来源视图支持查看某个渠道的全部 Session，也支持继续收窄到某个具体聊天。
- 项目视图中的来源筛选保持项目结构，不等同于切换到来源视图。
- 视图切换和来源范围不得修改 Workspace membership、`cwd` 或 Provider assignment。

验收标准：

- 一个在 `dsh-session-groups` Workspace 中执行、由飞书“Curio 作战室”发起的 Session，在项目视图归入 `dsh-session-groups`，行内标明“飞书 · Curio 作战室”。
- 同一个 Session 切换到来源视图后，归入“飞书 / Curio 作战室”，行内标明 `dsh-session-groups`。
- Provider 明确标注的群聊、话题和私聊可以按具体聊天分别浏览，不依靠标题猜测类型。
- 没有 Provider assignment 的 Session 进入 `本地或未标注来源`；没有可解析项目上下文的 Session 进入 `无项目`，两种缺失状态互不混淆。
- 同一 Session 在单个视图中不会因同时拥有两个属性而重复出现。
- 切换视图、筛选来源和打开 Session 后，现有 assignment 与 Workspace 数据保持不变。

#### P0-2 完整状态展示

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

#### P0-3 快捷筛选

需求：

- 搜索栏下方提供“待我处理”“运行中”“刚完成”“全部”快捷筛选。
- 快捷筛选显示跨分组数量。
- 支持状态、来源渠道、具体聊天和更新时间范围的详细筛选面板。
- 清空筛选后恢复原分组结构和排序。

验收标准：

- 用户最多两次点击即可只查看所有待响应 Session。
- 筛选不会修改 Session 的项目上下文、来源上下文或归档状态。
- 没有命中时显示明确空状态及“清除筛选”操作。

#### P0-4 标题与正文统一搜索

需求：

- 输入时先即时匹配 Session 标题、项目标题或路径、来源渠道、聊天标题和聊天类型。
- 非空查询经过短防抖后调用 DSH `sessions.search()` 查询对话正文。
- 正文命中展示 Session 标题、项目上下文、来源上下文和命中片段。
- 新查询取消上一次尚未完成的请求。
- 搜索失败时保留本地标题搜索结果，并提供非阻塞错误提示。
- 提供 `Cmd/Ctrl+K` 聚焦搜索框。

验收标准：

- 只记得历史对话中的短语时，可以找到对应 Session。
- 搜索过程中不会修改 Session 列表快照。
- 快速连续输入不会产生乱序覆盖。
- 搜索结果可以直接打开对应 Session。

#### P0-5 时间与辅助信息

需求：

- Session 行在空间允许时展示相对更新时间。
- 项目视图行内优先显示紧凑来源标识，来源视图行内优先显示紧凑项目标识。
- 完整更新时间、`cwd`、Agent preset、项目、来源渠道、聊天名称和聊天类型放入 tooltip 或详情菜单，避免常驻信息过多。

验收标准：

- 用户可以区分刚更新和长期未更新的同名任务。
- 窄栏中标题仍保留主要宽度，不因元数据严重截断。

#### P0-6 打开项目文件夹

需求：

- 真实 Workspace、目录项目以及来源视图中带可解析项目路径的 Session 菜单增加“打开文件夹”。
- 调用 DSH `workspaces.openPath()`，不自行执行平台相关命令。
- 没有项目路径时不展示该操作；来源聊天本身不冒充文件夹。

验收标准：

- 操作只打开目录，不修改文件和 Workspace 注册。
- 打开失败时使用现有非阻塞操作错误区域反馈。

#### P0-7 浏览偏好持久化

需求：

- 保存当前浏览视图、两种视图各自的分组折叠状态、当前排序方式和最后使用的筛选视角。
- 搜索查询默认不跨重启保存。
- 偏好与项目解析结果、Workspace 数据和 Provider assignment 分开存储。
- 已不存在的分组偏好可以安全忽略或按策略清理。

验收标准：

- 页面刷新后，当前浏览视图、分组折叠状态和排序偏好仍然存在。
- Workspace 或 Provider 修改显示标题，不会破坏以稳定项目 key 或来源 key 保存的偏好。
- 偏好损坏或读取失败时可以降级为默认布局。

### 7.2 P1：高频任务与历史管理

#### P1-1 置顶与收藏

- 支持置顶真实 Workspace、目录项目、来源渠道、具体聊天和 Session。
- 置顶只改变导航位置，不改变 Session 上下文或 Provider assignment。
- 同一层级内置顶项保持稳定次序。
- 置顶偏好存储在插件自己的用户偏好域。

#### P1-2 排序与拖拽

- 提供最近更新、名称、状态和手动排序。
- 真实 Workspace 拖拽使用 DSH `workspaces.insertBefore()`。
- 真实 Workspace 内 Session 拖拽使用 `workspaces.insertSessionBefore()`。
- 来源渠道、具体聊天及其 Session 的手动顺序属于插件偏好，不改写 Provider assignment。
- 目录项目的手动顺序属于插件偏好，不把目录自动注册为 Workspace。
- 搜索或状态筛选期间默认禁用拖拽，避免排序目标不明确。

#### P1-3 归档与管理

- 增加“归档与管理”入口，使用独立面板而不是长期占用侧栏。
- 支持查看已归档 Session、搜索、筛选、恢复和删除。
- 支持多选归档、恢复和删除。
- 删除必须明确区分“从列表归档”“删除 Session 记录”“删除 Workspace 注册”。
- 若当前 DSH Runtime 未暴露恢复或永久删除 API，需要先补齐 Host/Runtime 能力，不以直接写存储替代。

#### P1-4 统一上下文菜单

- Session 菜单包含打开、重命名、分叉、置顶和归档。
- Session 菜单包含“查看此项目中的会话”“查看此来源的全部会话”和“查看此聊天的全部会话”等跨视图入口；缺少对应上下文时隐藏相关操作。
- 真实 Workspace 菜单包含新建 Session、打开文件夹、重命名、置顶和删除注册。
- 来源渠道和具体聊天只提供展示层操作，不显示 Workspace 的重命名、删除注册或新建本地 Session 操作。
- 高风险操作需要确认，普通操作不使用阻塞式二次确认。

### 7.3 P2：Agent 活动与规模化管理

- 展开 Session 查看 Subagent 和后台 Job。
- 展示 Job 类型、标签、状态、运行时长及失败详情。
- 增加独立 Activity 入口，集中展示跨分组的待响应、失败、运行中和刚完成任务，并同时标明项目与来源。
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
| 项目 membership | `WorkspaceView.workspaceId`、`WorkspaceView.sessionIds` |
| 工作目录 | `SessionSummary.cwd`、`WorkspaceView.path` |
| Agent preset | `SessionSummary.agentPreset` |
| 后台任务 | `SessionListState.jobsBySession` |
| 对话正文搜索 | `ctx.sessions.search()` |
| 打开目录 | `ctx.workspaces.openPath()` |
| Workspace 排序 | `ctx.workspaces.insertBefore()` |
| Workspace 内 Session 排序 | `ctx.workspaces.insertSessionBefore()` |

因此 P0 的双轴投影、状态、全文搜索、时间信息和打开文件夹原则上不需要新增 Host 数据模型。项目解析使用现有 Workspace membership 与路径，来源解析使用现有 Provider assignment；二者只在浏览器展示层组合。

### 8.2 Provider 与 Workspace 所有权

- `workspaceId` 和显式 `sessionIds` membership 继续由 DSH Workspace 域拥有，插件不能因渠道 assignment 改写它们。
- `source + id` 继续作为 Provider 所属聊天的稳定身份。
- Provider 继续拥有来源渠道、聊天标题、聊天类型和 Session 的来源 assignment。
- Provider assignment 不再优先于真实 Workspace；它只参与来源视图和项目视图中的来源标识。
- Provider 最新 descriptor 仍决定同一稳定聊天的显示名称和类型。
- 用户置顶、折叠、排序、视图和筛选偏好是展示层数据，不写回 Workspace 或 Provider assignment。

### 8.3 现有接入与数据兼容

- 首轮继续兼容 Provider 已使用的 `ctx.sessionGroups.assign(sessionId, { id, title, source, kind })` 调用形态。
- 现有 `session_groups` 存储记录直接重新解释为“来源上下文”，不要求 Provider 重发 assignment，也不为切换视图迁移或复制数据。
- `SessionGroupAssignment` 等现有代码名称可以在首轮内部保留以减少破坏性变更；对外文档应说明它表达的是聊天来源，而不是排他的项目归属。
- 如果后续决定把公共 API 重命名为 `sessionOrigins`、`channelContext` 等更准确的名称，必须另立兼容期、类型别名和迁移方案，不纳入本轮隐式变更。
- 存量 Session 的项目归属每次从 DSH 当前 Workspace 与 `cwd` 数据派生，不写入第二份项目 assignment，避免两套真相漂移。

### 8.4 数据安全

- 不修改 Prompt、模型消息、Session 日志或工作目录。
- 全文搜索只调用 DSH 已有本地索引接口，不由插件建立第二份对话索引。
- 偏好数据不得包含对话正文、凭据或外部服务 Token。
- 插件自身继续不发起外部网络请求。

### 8.5 降级策略

- Provider 来源接口失败：项目视图继续按 Workspace/目录展示 Session；保留最近成功 assignment 作为来源标识，完全没有可用 assignment 时归入 `本地或未标注来源`。
- Workspace membership 不可用但 `cwd` 可用：退化为目录项目；两者均不可用时进入 `无项目`，不使用来源聊天冒充项目。
- 全文搜索失败：继续提供标题、项目和来源元数据搜索。
- 偏好读取失败：使用默认折叠和排序，不影响 Session 打开。
- Job 数据不可用：退化到 Session 级运行状态，不显示虚假错误。
- 未知状态或未知 Provider kind：不向用户暴露内部原始枚举。

## 9. 交互与视觉原则

- 状态不能只靠颜色表达，必须有可访问名称或 tooltip。
- 每行只保留一个主状态，减少视觉噪声。
- 行内常驻信息优先级为：状态、标题、另一维度的紧凑标识、相对时间；空间不足时先把完整上下文收进 tooltip，不隐藏标题。
- 项目、来源渠道和具体聊天必须使用不同层级或标签语义，不能只靠相似文件夹图标区分。
- 视图切换控件必须显示当前组织轴，来源筛选生效时还要显示筛选范围，避免用户混淆“换视图”和“过滤数据”。
- 低频操作进入 hover 菜单或上下文菜单。
- 分组总数和状态计数口径必须稳定且可解释。
- 侧栏负责快速定位，复杂的归档和批量管理进入独立面板。
- 当前 Session 高亮、键盘焦点和 hover 状态必须能明确区分。
- 动画遵循系统减少动态效果设置。

## 10. P0 完成定义

只有同时满足以下条件，P0 才算完成：

1. 每个可见 Session 能独立解析项目上下文和来源上下文，Provider assignment 不再遮蔽真实 Workspace。
2. 默认项目视图与来源视图可以切换；前者行内显示来源，后者行内显示项目。
3. 飞书、Slack 等渠道可以查看渠道下的全部 Session，并继续按群聊、话题或私聊浏览。
4. `无项目` 与 `本地或未标注来源` 的语义和空状态互不混淆。
5. 切换视图、来源筛选和现有存量 assignment 不会修改或复制 Workspace、`cwd` 与 Provider 数据。
6. 等待用户、后台 Job 失败、运行中、刚完成状态能正确显示和筛选。
7. 当前视图中的各级分组标题能聚合重要状态数量。
8. 标题搜索和 DSH 对话正文搜索在同一入口工作，并同时展示项目、来源和命中片段。
9. Session 行能展示更新时间与对侧上下文，辅助信息不会挤压主要标题。
10. 有真实项目路径的入口可以打开文件夹，没有路径的来源聊天不会获得虚假文件夹操作。
11. 当前浏览视图、两种视图的折叠状态、排序和筛选视角按约定持久化。
12. 现有打开、新建、重命名、分叉、归档及 Workspace 操作没有回归。
13. 双轴派生、路径边界、去重、状态派生、搜索竞态和偏好降级具备自动化测试。
14. README 的功能、Provider API 语义和限制说明与最终实现同步更新。

## 11. 后续实施顺序

建议实现顺序：

1. 抽离并测试项目上下文、来源上下文和路径边界解析，移除“Provider assignment 覆盖 Workspace”的投影规则。
2. 在保持 Provider API 与存量数据兼容的前提下实现项目视图、来源视图和行内对侧标识。
3. 抽离并测试 Session 主状态派生及两种视图的分组状态聚合。
4. 增加状态标记、来源范围和快捷筛选。
5. 接入全文搜索、取消和同时包含双轴上下文的结果片段。
6. 增加更新时间与打开项目文件夹操作。
7. 增加浏览视图及其他偏好存储与降级。
8. 完成可访问性、视觉、兼容性和回归测试。
9. 更新 README，再进入 P1 设计与实现。

本文件记录已确认的产品需求和范围，不代表本次已经开始代码实现。
