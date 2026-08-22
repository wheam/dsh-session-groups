/** Compact DSH-native session browser combining real Workspaces and provider virtual groups. */
import { useEffect, useMemo, useState } from 'react'
import type { PropsRuntime, SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import {
  IconArchiveOutline20,
  IconBranchOutline16,
  IconChevronDownOutline14,
  IconChevronRightOutline14,
  IconEditOutline16,
  IconFolderClose16,
  IconFolderOpen16,
  IconPlusOutline16,
  IconTrashOutline16,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type {
  SessionId,
  WorkspaceId,
} from '@deepseek-ai/dsh-client-runtime/client'
import type { SessionGroupsClientSnapshot } from './controller.js'
import { deriveBrowserGroups } from './groups.js'

/** Business callbacks and the renderer-bound observable hook. */
export interface SessionGroupsBrowserInjected {
  hooks: {
    sessionGroups: import('@deepseek-ai/dsh-client-ui-slots').HostObservable<SessionGroupsClientSnapshot>
  }
  refresh: () => Promise<void>
  open: (sessionId: SessionId) => void
  startSession: (workspaceId?: WorkspaceId) => void
  addWorkspace: () => Promise<void>
  renameSession: (sessionId: SessionId, currentTitle: string) => Promise<void>
  forkSession: (sessionId: SessionId) => Promise<void>
  archiveSession: (sessionId: SessionId) => Promise<void>
  renameWorkspace: (workspaceId: WorkspaceId, currentTitle: string) => Promise<void>
  deleteWorkspace: (workspaceId: WorkspaceId, title: string) => Promise<void>
}

type BrowserProps = PropsRuntime<'sidebar.workspaces'>
  & Omit<SessionGroupsBrowserInjected, 'hooks'>
  & { useSessionGroups: SnapshotSelectorHook<SessionGroupsClientSnapshot> }

/** Render the replacement browsing region. */
export function SessionGroupsBrowser({
  wide,
  expandSidebar,
  useSessions,
  useWorkspaces,
  useSessionGroups,
  refresh,
  open,
  startSession,
  addWorkspace,
  renameSession,
  forkSession,
  archiveSession,
  renameWorkspace,
  deleteWorkspace,
}: BrowserProps) {
  const sessions = useSessions(value => value)
  const workspaces = useWorkspaces(value => value)
  const remote = useSessionGroups(value => value)
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set())
  const [actionError, setActionError] = useState<string>()
  const sessionKey = sessions.ids.join('\u0000')

  useEffect(() => { void refresh() }, [refresh, sessionKey])

  const groups = useMemo(() => deriveBrowserGroups(
    sessions,
    workspaces.items,
    workspaces.archivedSessionIds,
    remote.assignments,
  ), [sessions, workspaces.items, workspaces.archivedSessionIds, remote.assignments])

  const normalizedQuery = query.trim().toLocaleLowerCase()
  const visibleGroups = normalizedQuery === '' ? groups : groups
    .map(group => ({
      ...group,
      sessions: group.sessions.filter(session => session.displayTitle.toLocaleLowerCase().includes(normalizedQuery)),
    }))
    .filter(group => group.title.toLocaleLowerCase().includes(normalizedQuery) || group.sessions.length > 0)

  if (!wide) {
    return (
      <div className="sg_rail">
        <button className="sg_railButton" type="button" title="会话分组" onClick={expandSidebar}>组</button>
      </div>
    )
  }

  const toggle = (key: string) => {
    setCollapsed(previous => {
      const next = new Set(previous)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }
  const run = (operation: Promise<void>) => {
    setActionError(undefined)
    void operation.catch(error => {
      setActionError(error instanceof Error ? error.message : String(error))
    })
  }

  return (
    <section className="sg_root" aria-label="会话分组">
      <header className="sg_header">
        <strong>会话</strong>
        <button className="sg_iconButton" type="button" title="添加 Workspace" aria-label="添加 Workspace" onClick={() => { run(addWorkspace()) }}><IconPlusOutline16 /></button>
      </header>
      <div className="sg_searchWrap">
        <input
          className="sg_search"
          type="search"
          value={query}
          placeholder="搜索会话或分组"
          onChange={event => { setQuery(event.currentTarget.value) }}
        />
      </div>
      {remote.loading ? <p className="sg_status">正在读取分组…</p> : null}
      {remote.error !== undefined ? <p className="sg_error" title={remote.error}>分组服务暂时不可用，显示本地会话</p> : null}
      {actionError !== undefined ? <p className="sg_error" title={actionError}>操作失败：{actionError}</p> : null}
      <div className="sg_groups">
        {visibleGroups.map(group => {
          const folded = collapsed.has(group.key)
          return (
            <section className="sg_group" key={group.key}>
              <div className="sg_groupHead">
                <button className="sg_groupToggle" type="button" onClick={() => { toggle(group.key) }}>
                  <span className="sg_chevron" aria-hidden>{folded ? <IconChevronRightOutline14 /> : <IconChevronDownOutline14 />}</span>
                  <span className="sg_folder" aria-hidden>{folded ? <IconFolderClose16 /> : <IconFolderOpen16 />}</span>
                  <span className="sg_groupTitle" title={group.title}>{group.title}</span>
                  {group.source === undefined ? null : <span className="sg_source">{group.source}</span>}
                  <span className="sg_count">{group.sessions.length}</span>
                </button>
                {group.workspaceId === undefined ? null : (
                  <div className="sg_groupActions">
                    <button type="button" title="新建会话" aria-label="新建会话" onClick={() => { startSession(group.workspaceId) }}><IconPlusOutline16 /></button>
                    <button type="button" title="重命名 Workspace" aria-label="重命名 Workspace" onClick={() => { run(renameWorkspace(group.workspaceId!, group.title)) }}><IconEditOutline16 /></button>
                    <button type="button" title="删除 Workspace 分组" aria-label="删除 Workspace 分组" onClick={() => { run(deleteWorkspace(group.workspaceId!, group.title)) }}><IconTrashOutline16 /></button>
                  </div>
                )}
              </div>
              {folded ? null : (
                <div className="sg_sessions">
                  {group.sessions.map(session => (
                    <div className={session.id === sessions.current ? 'sg_session sg_sessionCurrent' : 'sg_session'} key={session.id}>
                      <button className="sg_sessionOpen" type="button" onClick={() => { open(session.id) }}>
                        <span className="sg_statusSlot">{session.running ? <span className="sg_dot sg_dotRunning" title="正在运行" aria-label="正在运行" /> : null}</span>
                        <span className="sg_sessionTitle" title={session.displayTitle}>{session.blank ? '新会话' : session.displayTitle}</span>
                      </button>
                      <div className="sg_sessionActions">
                        <button type="button" title="重命名" aria-label="重命名" onClick={() => { run(renameSession(session.id, session.displayTitle)) }}><IconEditOutline16 /></button>
                        <button type="button" title="分叉会话" aria-label="分叉会话" onClick={() => { run(forkSession(session.id)) }}><IconBranchOutline16 /></button>
                        <button type="button" title="归档" aria-label="归档" onClick={() => { run(archiveSession(session.id)) }}><IconArchiveOutline20 size={16} /></button>
                      </div>
                    </div>
                  ))}
                  {group.sessions.length === 0 ? <p className="sg_empty">暂无会话</p> : null}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </section>
  )
}
