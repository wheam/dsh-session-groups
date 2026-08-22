/** Browser half: mounts the typed Remote and shadows the stock Workspace browser through Slot priority. */
import type { ClientContext, SessionId, WorkspaceId } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-api-gateway/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import groupsRemote from 'dsh-session-groups/remote'
import { SessionGroupsBrowser, type SessionGroupsBrowserInjected } from './browser.js'
import { SessionGroupsController, type SessionGroupsRemoteFace } from './controller.js'
import { installStyles } from './styles.js'

export const inject = ['slots', 'sessions', 'workspaces', 'remote']

/** Mount the Remote projection, refresh controller, and priority-shadowed sidebar entry. */
export async function apply(ctx: ClientContext): Promise<() => Promise<void>> {
  const disposeRemote = await ctx.remote.$mount(groupsRemote)
  // Resolve the mounted namespace from the service store. Reading the dotted
  // ctx.remote.sessionGroups path walks the Loader fiber chain and can stop at
  // a runtime-less fork before reaching the mounted namespace.
  const remote = (ctx.reflect as unknown as { get(name: string): unknown })
    .get('remote.sessionGroups') as SessionGroupsRemoteFace | undefined
  if (remote === undefined) {
    await disposeRemote()
    throw new Error('dsh-session-groups: the sessionGroups Remote namespace did not mount')
  }
  const controller = new SessionGroupsController(remote)
  const disposeStyles = installStyles()

  const injected = (): SessionGroupsBrowserInjected => ({
    hooks: { sessionGroups: controller.source },
    refresh: () => controller.refresh(),
    open: sessionId => { ctx.sessions.open(sessionId) },
    openSubagent: address => { ctx.sessions.openSubagent(address) },
    refreshSubagents: sessionId => ctx.sessions.refreshSubagents(sessionId),
    setSubagentCatalogOpen: (sessionId, open) => { ctx.sessions.setSubagentCatalogOpen(sessionId, open) },
    searchContent: async (query, signal) => {
      const result = await ctx.sessions.search(query, signal)
      if (!result.ok) throw new Error(result.error.message)
      return result.value
    },
    startSession: workspaceId => { ctx.workspaces.startSession(workspaceId) },
    addWorkspace: async () => {
      const path = await ctx.workspaces.pickDirectory()
      if (path !== null) await ctx.workspaces.create({ path })
    },
    openPath: path => ctx.workspaces.openPath(path),
    renameSession: async (sessionId: SessionId, currentTitle: string) => {
      const title = window.prompt('新的会话名称', currentTitle)?.trim()
      if (title === undefined || title === '') return
      const session = ctx.sessions.binding(sessionId)?.session
      if (session === undefined) throw new Error(`unknown session ${sessionId}`)
      const result = await session.rename(title)
      if (!result.ok) throw new Error(result.error.message)
    },
    forkSession: async (sessionId: SessionId) => {
      const child = await ctx.sessions.fork({ sessionId, increaseTitle: true })
      ctx.sessions.open(child)
    },
    archiveSession: async (sessionId: SessionId) => { await ctx.workspaces.archiveSession(sessionId) },
    moveWorkspace: (workspaceId, beforeWorkspaceId) => ctx.workspaces.insertBefore(workspaceId, beforeWorkspaceId),
    moveSession: async (workspaceId, sessionId, beforeSessionId) => {
      await ctx.workspaces.insertSessionBefore(workspaceId, sessionId, beforeSessionId)
    },
    renameWorkspace: async (workspaceId: WorkspaceId, currentTitle: string) => {
      const title = window.prompt('新的 Workspace 名称', currentTitle)?.trim()
      if (title !== undefined && title !== '') await ctx.workspaces.rename(workspaceId, title)
    },
    deleteWorkspace: async (workspaceId: WorkspaceId, title: string) => {
      if (window.confirm(`删除 Workspace 分组“${title}”？会话记录不会被删除。`)) {
        await ctx.workspaces.delete(workspaceId)
      }
    },
  })

  ctx.slots.inject('sidebar.workspaces', () => ctx.slots.register({
    name: 'sidebar.workspaces',
    priority: -100,
    inject: injected,
    registrant: 'dsh-session-groups',
  }, SessionGroupsBrowser))

  // Render immediately with local Session/Workspace data. A slow or broken
  // Remote must not hold the entire client plugin in its apply phase.
  void controller.refresh()
  const timer = window.setInterval(() => { void controller.refresh() }, 15_000)
  return async () => {
    window.clearInterval(timer)
    disposeStyles()
    await disposeRemote()
  }
}
