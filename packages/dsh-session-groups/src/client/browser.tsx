/** DSH-native task browser with independent project and communication-source views. */
import {
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
  type SyntheticEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { PropsRuntime, SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import {
  IconArchiveOutline20,
  IconBrowseOutline16,
  IconEditOutline16,
  IconEllipsisOutline16,
  IconFolderOpenOutline16,
  IconPlusOutline16,
  IconRefreshOutline14,
  IconTrashOutline16,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { SessionSearchResultItem } from '@deepseek-ai/dsh-api-session-controller/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { SubagentAddress } from '@deepseek-ai/dsh-subagent/client'
import type { WorkspaceId } from '@deepseek-ai/dsh-api-workspace-controller/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import { sessionGroupsErrorMessage, type SessionGroupsClientSnapshot } from './controller.js'
import {
  countStatuses,
  deriveBrowserSessions,
  groupBrowserSessions,
  newestFirst,
  sessionGroupKindLabel,
  type BrowserGroup,
  type BrowserSession,
  type BrowseMode,
  type SessionAttention,
} from './groups.js'
import {
  defaultPreferences,
  loadPreferences,
  moveKeyBefore,
  orderByKeys,
  savePreferences,
  toggleListItem,
  type BrowserPreferences,
} from './preferences.js'
import { SessionGroupIcon } from './source-icons.js'
import { ContentSearchCoordinator } from './search.js'

/** Business callbacks and the renderer-bound observable hook. */
export interface SessionGroupsBrowserInjected {
  hooks: {
    sessionGroups: import('@deepseek-ai/dsh-client-ui-slots').HostObservable<SessionGroupsClientSnapshot>
  }
  refresh: () => Promise<void>
  open: (sessionId: SessionId) => void
  openSubagent: (address: SubagentAddress) => void
  refreshSubagents: (sessionId: SessionId) => Promise<void>
  setSubagentCatalogOpen: (sessionId: SessionId, open: boolean) => void
  searchContent: (query: string, signal: AbortSignal) => Promise<{
    items: readonly SessionSearchResultItem[]
    hasMore: boolean
  }>
  startSession: (workspaceId?: WorkspaceId) => void
  addWorkspace: () => Promise<void>
  openPath: (path: string) => Promise<void>
  renameSession: (sessionId: SessionId, currentTitle: string) => Promise<void>
  forkSession: (sessionId: SessionId) => Promise<void>
  archiveSession: (sessionId: SessionId) => Promise<void>
  renameWorkspace: (workspaceId: WorkspaceId, currentTitle: string) => Promise<void>
  deleteWorkspace: (workspaceId: WorkspaceId, title: string) => Promise<void>
  moveWorkspace: (workspaceId: WorkspaceId, beforeWorkspaceId?: WorkspaceId) => Promise<void>
  moveSession: (workspaceId: WorkspaceId, sessionId: SessionId, beforeSessionId?: SessionId) => Promise<void>
}

type BrowserProps = PropsRuntime<'sidebar.workspaces'>
  & Omit<SessionGroupsBrowserInjected, 'hooks'>
  & { useSessionGroups: SnapshotSelectorHook<SessionGroupsClientSnapshot> }

type Surface = 'browse' | 'activity' | 'archive'
type Dragged =
  | { readonly type: 'group', readonly group: BrowserGroup, readonly parentKey?: string }
  | { readonly type: 'session', readonly entry: BrowserSession, readonly groupKey: string }

/** Local gap-fill until the DSH primitive icon set exposes a pin glyph. */
function IconPinOutline16() {
  return (
    <svg className="sg_menuIcon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M5 2.5h6M6.25 2.5v3L4.5 8.25V9.5h7V8.25L9.75 5.5v-3M8 9.5v4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const ATTENTION_ORDER: Readonly<Record<SessionAttention, number>> = {
  waiting: 0,
  failed: 1,
  running: 2,
  completed: 3,
  idle: 4,
}

const ATTENTION_COPY: Readonly<Record<SessionAttention, { label: string, short: string }>> = {
  waiting: { label: '等待用户', short: '待' },
  failed: { label: '后台任务失败', short: '失败' },
  running: { label: '正在运行', short: '运行' },
  completed: { label: '未读（已完成）', short: '未读' },
  idle: { label: '空闲', short: '空闲' },
}

function pendingLabel(entry: BrowserSession): string {
  switch (entry.pendingInteraction) {
    case 'approval': return '等待审批'
    case 'plan-review': return '等待计划审核'
    case 'question': return '等待回答问题'
    default: return ATTENTION_COPY[entry.attention].label
  }
}

function duration(startedAt: number, finishedAt: number | undefined, now: number): string {
  const seconds = Math.max(0, Math.floor(((finishedAt ?? now) - startedAt) / 1_000))
  if (seconds < 60) return `${seconds} 秒`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} 分钟`
  return `${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分钟`
}

function sourceLabel(entry: BrowserSession): string {
  if (entry.source.rawSource === undefined) return entry.source.familyTitle
  return entry.source.chatTitle === undefined
    ? entry.source.familyTitle
    : `${entry.source.familyTitle} · ${entry.source.chatTitle}`
}

/** Missing assignment is the default in project view, so only explicit origins earn row metadata. */
function explicitSourceLabel(entry: BrowserSession): string | undefined {
  return entry.source.rawSource === undefined ? undefined : sourceLabel(entry)
}

function metadata(entry: BrowserSession): string {
  const parts = [
    `状态：${pendingLabel(entry)}`,
    `项目：${entry.project.title}`,
    entry.project.path === undefined ? undefined : `项目路径：${entry.project.path}`,
    entry.summary.cwd === undefined ? undefined : `工作目录：${entry.summary.cwd}`,
    `来源：${sourceLabel(entry)}`,
    entry.source.kind === undefined ? undefined : `聊天类型：${sessionGroupKindLabel(entry.source.kind) ?? entry.source.kind}`,
    entry.agentPreset === undefined ? undefined : `Agent preset：${entry.agentPreset}`,
    `阅读状态：${entry.unread ? '未读' : '已读'}`,
    `更新时间：${new Date(entry.summary.updatedAt).toLocaleString()}`,
  ]
  return parts.filter((part): part is string => part !== undefined).join('\n')
}

function searchText(entry: BrowserSession): string {
  return [
    entry.summary.displayTitle,
    entry.summary.cwd,
    entry.agentPreset,
    entry.project.title,
    entry.project.path,
    entry.source.familyTitle,
    entry.source.rawSource,
    entry.source.chatTitle,
    entry.source.kind,
    sessionGroupKindLabel(entry.source.kind),
  ].filter((part): part is string => part !== undefined).join('\n').toLocaleLowerCase()
}

function groupSize(group: BrowserGroup): number {
  return group.sessions.length + (group.children?.reduce((total, child) => total + groupSize(child), 0) ?? 0)
}

function groupActivity(group: BrowserGroup): number {
  return Math.max(
    0,
    ...group.sessions.map(entry => entry.summary.updatedAt),
    ...(group.children?.map(groupActivity) ?? []),
  )
}

function groupAttentionRank(group: BrowserGroup): number {
  if (group.counts.waiting > 0) return 0
  if (group.counts.failed > 0) return 1
  if (group.counts.running > 0) return 2
  if (group.counts.unread > 0) return 3
  return 4
}

function updatedCutoff(range: BrowserPreferences['updatedRange'], now: number): number {
  switch (range) {
    case 'day': return now - 24 * 60 * 60 * 1_000
    case 'week': return now - 7 * 24 * 60 * 60 * 1_000
    case 'month': return now - 30 * 24 * 60 * 60 * 1_000
    default: return 0
  }
}

function activityGroups(entries: readonly BrowserSession[]): BrowserGroup[] {
  const definitions: ReadonlyArray<readonly [SessionAttention, string]> = [
    ['waiting', '等待用户'],
    ['failed', '后台任务失败'],
    ['running', '运行中'],
    ['completed', '未读'],
  ]
  return definitions.flatMap(([attention, title]) => {
    const matching = entries.filter(entry => entry.attention === attention)
    return matching.length === 0 ? [] : [{
      key: `activity:${attention}`,
      type: 'activity' as const,
      title,
      sessions: matching,
      counts: countStatuses(matching),
    }]
  })
}

function indexGroups(groups: readonly BrowserGroup[], result = new Map<string, BrowserGroup>()): ReadonlyMap<string, BrowserGroup> {
  for (const group of groups) {
    result.set(group.key, group)
    if (group.children !== undefined) indexGroups(group.children, result)
  }
  return result
}

/** Session ids that are actually rendered, excluding the contents of folded groups. */
function renderedSessionIds(groups: readonly BrowserGroup[], collapsed: ReadonlySet<string>): SessionId[] {
  const result: SessionId[] = []
  for (const group of groups) {
    if (collapsed.has(group.key)) continue
    result.push(...group.sessions.map(entry => entry.summary.id))
    if (group.children !== undefined) result.push(...renderedSessionIds(group.children, collapsed))
  }
  return result
}

/** Render the replacement browsing region. */
export function SessionGroupsBrowser({
  wide,
  expandSidebar,
  useSessions,
  useSessionPendingInteraction,
  useWorkspaces,
  useSessionGroups,
  refresh,
  open,
  openSubagent,
  refreshSubagents,
  setSubagentCatalogOpen,
  searchContent,
  startSession,
  addWorkspace,
  openPath,
  renameSession,
  forkSession,
  archiveSession,
  renameWorkspace,
  deleteWorkspace,
  moveWorkspace,
  moveSession,
}: BrowserProps) {
  const sessions = useSessions(value => value)
  const pendingInteractions = useSessionPendingInteraction(value => value)
  const workspaces = useWorkspaces(value => value)
  const remote = useSessionGroups(value => value)
  const [preferences, setPreferences] = useState<BrowserPreferences>(() => {
    if (typeof window === 'undefined') return defaultPreferences()
    return loadPreferences(window.localStorage)
  })
  const [surface, setSurface] = useState<Surface>('browse')
  const [query, setQuery] = useState('')
  const [contentHits, setContentHits] = useState<ReadonlyMap<SessionId, string>>(() => new Map())
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string>()
  const [searchHasMore, setSearchHasMore] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [actionError, setActionError] = useState<string>()
  const [manageMode, setManageMode] = useState(false)
  const [selected, setSelected] = useState<ReadonlySet<SessionId>>(() => new Set())
  const [expandedActivity, setExpandedActivity] = useState<ReadonlySet<SessionId>>(() => new Set())
  const [activityCollapsed, setActivityCollapsed] = useState<ReadonlySet<string>>(() => new Set())
  const [dragged, setDragged] = useState<Dragged>()
  const [now, setNow] = useState(() => Date.now())
  const searchRef = useRef<HTMLInputElement>(null)
  const focusAfterExpandRef = useRef(false)
  const searchCoordinator = useRef(new ContentSearchCoordinator<SessionSearchResultItem>()).current
  const expandedActivityRef = useRef<ReadonlySet<SessionId>>(expandedActivity)
  expandedActivityRef.current = expandedActivity
  const sessionKey = sessions.ids.join('\u0000')

  const patchPreferences = (patch: Partial<BrowserPreferences>) => {
    setPreferences(previous => ({ ...previous, ...patch }))
  }
  const run = (operation: Promise<void>) => {
    setActionError(undefined)
    void operation.catch(error => {
      setActionError(error instanceof Error ? error.message : String(error))
    })
  }

  useEffect(() => { void refresh() }, [refresh, sessionKey])
  useEffect(() => {
    if (typeof window !== 'undefined') savePreferences(window.localStorage, preferences)
  }, [preferences])
  useEffect(() => {
    const timer = window.setInterval(() => { setNow(Date.now()) }, 60_000)
    return () => { window.clearInterval(timer) }
  }, [])
  useEffect(() => {
    setSelected(new Set())
    setManageMode(false)
  }, [surface])
  useEffect(() => () => {
    for (const sessionId of expandedActivityRef.current) setSubagentCatalogOpen(sessionId, false)
  }, [setSubagentCatalogOpen])
  useEffect(() => {
    const focusSearch = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
        const input = searchRef.current
        if (input !== null) {
          event.preventDefault()
          input.focus()
        } else if (!wide) {
          event.preventDefault()
          focusAfterExpandRef.current = true
          expandSidebar()
        }
      }
    }
    window.addEventListener('keydown', focusSearch)
    return () => { window.removeEventListener('keydown', focusSearch) }
  }, [expandSidebar, wide])
  useEffect(() => {
    if (!wide || !focusAfterExpandRef.current) return
    focusAfterExpandRef.current = false
    searchRef.current?.focus()
  }, [wide])

  const normalizedQuery = query.trim().toLocaleLowerCase()
  useEffect(() => {
    if (normalizedQuery === '') {
      setContentHits(new Map())
      setSearchError(undefined)
      setSearchHasMore(false)
      setSearching(false)
      return
    }
    const timer = window.setTimeout(() => {
      setSearching(true)
      setSearchError(undefined)
      void searchCoordinator.run(query.trim(), searchContent).then(result => {
        if (result === undefined) return
        setContentHits(new Map(result.items.map(item => [item.sessionId, item.snippet])))
        setSearchHasMore(result.hasMore)
        setSearching(false)
      }).catch(error => {
        setSearchError(error instanceof Error ? error.message : String(error))
        setContentHits(new Map())
        setSearching(false)
      })
    }, 220)
    return () => {
      window.clearTimeout(timer)
      searchCoordinator.cancel()
    }
  }, [normalizedQuery, query, searchContent, searchCoordinator])

  const entries = useMemo(() => deriveBrowserSessions(
    sessions,
    workspaces.items,
    workspaces.archivedSessionIds,
    remote.assignments,
    pendingInteractions,
  ), [sessions, workspaces.items, workspaces.archivedSessionIds, remote.assignments, pendingInteractions])

  const activeEntries = useMemo(() => entries.filter(entry => !entry.archived), [entries])
  const quickEntries = useMemo(() => {
    if (surface === 'archive') return entries.filter(entry => entry.archived)
    if (surface === 'activity') return activeEntries.filter(entry => entry.attention !== 'idle')
    return activeEntries
  }, [activeEntries, entries, surface])
  const statusCounts = useMemo(() => countStatuses(quickEntries), [quickEntries])
  const sourceOptions = useMemo(() => {
    const unique = new Map<string, string>()
    for (const entry of entries) unique.set(entry.source.familyKey, entry.source.familyTitle)
    return [...unique.entries()].toSorted((left, right) => left[1].localeCompare(right[1]))
  }, [entries])
  const chatOptions = useMemo(() => {
    const unique = new Map<string, string>()
    for (const entry of entries) {
      if (preferences.sourceFilter !== '' && entry.source.familyKey !== preferences.sourceFilter) continue
      if (entry.source.chatTitle !== undefined) unique.set(entry.source.chatKey, entry.source.chatTitle)
    }
    return [...unique.entries()].toSorted((left, right) => left[1].localeCompare(right[1]))
  }, [entries, preferences.sourceFilter])
  useEffect(() => {
    if (sessions.phase !== 'ready' || remote.loading || remote.error !== undefined) return
    if (preferences.sourceFilter !== '' && !sourceOptions.some(([key]) => key === preferences.sourceFilter)) {
      patchPreferences({ sourceFilter: '', chatFilter: '' })
      return
    }
    if (preferences.chatFilter !== '' && !chatOptions.some(([key]) => key === preferences.chatFilter)) {
      patchPreferences({ chatFilter: '' })
    }
    // This reconciliation intentionally runs only when live option identities change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatOptions, preferences.chatFilter, preferences.sourceFilter, remote.error, remote.loading, sessions.phase, sourceOptions])

  const filteredEntries = useMemo(() => {
    const cutoff = updatedCutoff(preferences.updatedRange, now)
    return entries.filter(entry => {
      if (surface === 'archive' ? !entry.archived : entry.archived) return false
      if (surface === 'activity' && entry.attention === 'idle') return false
      if (preferences.attentionFilter !== 'all') {
        const matchesAttention = preferences.attentionFilter === 'completed'
          ? entry.unread
          : entry.attention === preferences.attentionFilter
        if (!matchesAttention) return false
      }
      if (preferences.sourceFilter !== '' && entry.source.familyKey !== preferences.sourceFilter) return false
      if (preferences.chatFilter !== '' && entry.source.chatKey !== preferences.chatFilter) return false
      if (entry.summary.updatedAt < cutoff) return false
      if (normalizedQuery !== ''
        && !searchText(entry).includes(normalizedQuery)
        && !contentHits.has(entry.summary.id)) return false
      return true
    })
  }, [contentHits, entries, normalizedQuery, now, preferences, surface])

  const hasActiveFilters = normalizedQuery !== ''
    || preferences.attentionFilter !== 'all'
    || preferences.sourceFilter !== ''
    || preferences.chatFilter !== ''
    || preferences.updatedRange !== 'any'

  const fullSurfaceEntries = useMemo(() => entries.filter(entry => {
    if (surface === 'archive' ? !entry.archived : entry.archived) return false
    return surface !== 'activity' || entry.attention !== 'idle'
  }), [entries, surface])

  const fullGroupIndex = useMemo(() => indexGroups(
    surface === 'activity'
      ? activityGroups(fullSurfaceEntries)
      : groupBrowserSessions(fullSurfaceEntries, workspaces.items, preferences.browseMode),
  ), [fullSurfaceEntries, preferences.browseMode, surface, workspaces.items])

  const sortSessions = (items: readonly BrowserSession[], group: BrowserGroup): BrowserSession[] => {
    const pinned = new Set(preferences.pinnedSessions)
    let sorted: BrowserSession[]
    switch (preferences.sortMode) {
      case 'recent': sorted = items.toSorted(newestFirst); break
      case 'name': sorted = items.toSorted((left, right) => left.summary.displayTitle.localeCompare(right.summary.displayTitle)); break
      case 'status': sorted = items.toSorted((left, right) => ATTENTION_ORDER[left.attention] - ATTENTION_ORDER[right.attention] || newestFirst(left, right)); break
      default:
        sorted = preferences.browseMode === 'project' && group.workspaceId !== undefined
          ? [...items]
          : orderByKeys(items, preferences.manualSessions[group.key] ?? [], item => String(item.summary.id))
        break
    }
    return sorted.toSorted((left, right) => Number(pinned.has(String(right.summary.id))) - Number(pinned.has(String(left.summary.id))))
  }

  const sortGroups = (items: readonly BrowserGroup[], useGroupPreferences = true): BrowserGroup[] => {
    const withChildren = items.map(group => ({
      ...group,
      sessions: sortSessions(group.sessions, group),
      ...(group.children === undefined ? {} : { children: sortGroups(group.children, useGroupPreferences) }),
    }))
    let sorted: BrowserGroup[]
    switch (preferences.sortMode) {
      case 'recent': sorted = withChildren.toSorted((left, right) => groupActivity(right) - groupActivity(left)); break
      case 'name': sorted = withChildren.toSorted((left, right) => left.title.localeCompare(right.title)); break
      case 'status': sorted = withChildren.toSorted((left, right) => groupAttentionRank(left) - groupAttentionRank(right) || groupActivity(right) - groupActivity(left)); break
      default: sorted = useGroupPreferences
        ? orderByKeys(withChildren, preferences.manualGroups[preferences.browseMode], group => group.key)
        : withChildren; break
    }
    const pinned = new Set(useGroupPreferences ? preferences.pinnedGroups[preferences.browseMode] : [])
    return sorted.toSorted((left, right) => Number(pinned.has(right.key)) - Number(pinned.has(left.key)))
  }

  const groups = useMemo(() => {
    if (surface === 'activity') {
      return sortGroups(activityGroups(filteredEntries), false)
    }
    const projected = groupBrowserSessions(filteredEntries, workspaces.items, preferences.browseMode)
    const keepEmptyProjects = surface === 'browse' && !hasActiveFilters && preferences.browseMode === 'project'
    return sortGroups(projected.filter(group => keepEmptyProjects || groupSize(group) > 0))
    // sortGroups closes over the complete preference object; every referenced field is listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredEntries, hasActiveFilters, preferences, surface, workspaces.items])

  if (!wide) {
    return (
      <div className="sg_rail">
        <button
          className="sg_railButton"
          type="button"
          title="任务浏览器"
          aria-label="展开任务浏览器"
          onClick={expandSidebar}
        ><IconBrowseOutline16 size={18} /></button>
      </div>
    )
  }

  const setBrowseMode = (mode: BrowseMode) => {
    setSurface('browse')
    patchPreferences({ browseMode: mode })
  }
  const clearFilters = () => {
    setQuery('')
    patchPreferences({ attentionFilter: 'all', sourceFilter: '', chatFilter: '', updatedRange: 'any' })
  }
  const collapsed = surface === 'activity'
    ? activityCollapsed
    : new Set(preferences.collapsed[preferences.browseMode])
  const toggleCollapsed = (key: string) => {
    if (surface === 'activity') {
      setActivityCollapsed(previous => {
        const next = new Set(previous)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        return next
      })
      return
    }
    patchPreferences({
      collapsed: {
        ...preferences.collapsed,
        [preferences.browseMode]: toggleListItem(preferences.collapsed[preferences.browseMode], key),
      },
    })
  }
  const togglePinnedGroup = (key: string) => {
    patchPreferences({
      pinnedGroups: {
        ...preferences.pinnedGroups,
        [preferences.browseMode]: toggleListItem(preferences.pinnedGroups[preferences.browseMode], key),
      },
    })
  }
  const togglePinnedSession = (sessionId: SessionId) => {
    patchPreferences({ pinnedSessions: toggleListItem(preferences.pinnedSessions, String(sessionId)) })
  }
  const toggleSelected = (sessionId: SessionId) => {
    setSelected(previous => {
      const next = new Set(previous)
      if (next.has(sessionId)) next.delete(sessionId)
      else next.add(sessionId)
      return next
    })
  }
  const archiveSelected = async (sessionIds: readonly SessionId[]) => {
    const failed: SessionId[] = []
    let succeeded = 0
    for (const sessionId of sessionIds) {
      try {
        await archiveSession(sessionId)
        succeeded += 1
      } catch {
        failed.push(sessionId)
      }
    }
    setSelected(new Set(failed))
    if (failed.length === 0) setManageMode(false)
    else throw new Error(`批量归档完成：${succeeded} 个成功，${failed.length} 个失败；失败项仍保持选中。`)
  }
  const confirmArchiveSelected = () => {
    const sessionIds = [...selected]
    if (sessionIds.length === 0) return
    const confirmed = window.confirm(`确认归档选中的 ${sessionIds.length} 个会话？\n\n当前 DSH Runtime 未提供恢复 API，请确认后继续。`)
    if (confirmed) run(archiveSelected(sessionIds))
  }
  const toggleSessionActivity = (entry: BrowserSession) => {
    const willOpen = !expandedActivity.has(entry.summary.id)
    setExpandedActivity(previous => {
      const next = new Set(previous)
      if (willOpen) next.add(entry.summary.id)
      else next.delete(entry.summary.id)
      return next
    })
    setSubagentCatalogOpen(entry.summary.id, willOpen)
    if (willOpen) run(refreshSubagents(entry.summary.id))
  }
  const canDrag = surface === 'browse' && preferences.sortMode === 'manual' && !hasActiveFilters && !manageMode

  const explicitWorkspaceForGroup = (group: BrowserGroup) => group.workspaceId === undefined
    ? undefined
    : workspaces.items.find(workspace => workspace.workspaceId === group.workspaceId)

  const canDragSession = (entry: BrowserSession, group: BrowserGroup) => {
    if (!canDrag) return false
    if (preferences.browseMode !== 'project' || group.workspaceId === undefined) return true
    return explicitWorkspaceForGroup(group)?.sessionIds.includes(entry.summary.id) === true
  }

  const dropGroup = (event: DragEvent, target: BrowserGroup, siblingKeys: readonly string[], parentKey?: string) => {
    event.preventDefault()
    if (!canDrag || dragged?.type !== 'group' || dragged.group.key === target.key || dragged.parentKey !== parentKey) return
    const source = dragged.group
    if (source.workspaceId !== undefined && target.workspaceId !== undefined) {
      run(moveWorkspace(source.workspaceId, target.workspaceId))
    } else {
      const current = [...new Set([...preferences.manualGroups[preferences.browseMode], ...siblingKeys])]
      patchPreferences({
        manualGroups: {
          ...preferences.manualGroups,
          [preferences.browseMode]: moveKeyBefore(current, source.key, target.key),
        },
      })
    }
    setDragged(undefined)
  }

  const dropSession = (event: DragEvent, target: BrowserSession, group: BrowserGroup) => {
    event.preventDefault()
    if (!canDrag
      || dragged?.type !== 'session'
      || dragged.groupKey !== group.key
      || dragged.entry.summary.id === target.summary.id) return
    const workspace = explicitWorkspaceForGroup(group)
    const bothExplicitMembers = workspace !== undefined
      && workspace.sessionIds.includes(dragged.entry.summary.id)
      && workspace.sessionIds.includes(target.summary.id)
    if (preferences.browseMode === 'project' && bothExplicitMembers) {
      run(moveSession(workspace.workspaceId, dragged.entry.summary.id, target.summary.id))
    } else if (workspace === undefined) {
      const ids = group.sessions.map(item => String(item.summary.id))
      const current = [...new Set([...(preferences.manualSessions[group.key] ?? []), ...ids])]
      patchPreferences({
        manualSessions: {
          ...preferences.manualSessions,
          [group.key]: moveKeyBefore(current, String(dragged.entry.summary.id), String(target.summary.id)),
        },
      })
    }
    setDragged(undefined)
  }

  const dropGroupAtEnd = (event: DragEvent, siblings: readonly BrowserGroup[], parentKey?: string) => {
    event.preventDefault()
    if (!canDrag || dragged?.type !== 'group' || dragged.parentKey !== parentKey) return
    if (dragged.group.workspaceId !== undefined && siblings.some(group => group.workspaceId !== undefined)) {
      run(moveWorkspace(dragged.group.workspaceId))
    } else {
      const current = [...new Set([...preferences.manualGroups[preferences.browseMode], ...siblings.map(group => group.key)])]
      patchPreferences({
        manualGroups: {
          ...preferences.manualGroups,
          [preferences.browseMode]: moveKeyBefore(current, dragged.group.key),
        },
      })
    }
    setDragged(undefined)
  }

  const dropSessionAtEnd = (event: DragEvent, group: BrowserGroup) => {
    event.preventDefault()
    if (!canDrag || dragged?.type !== 'session' || dragged.groupKey !== group.key) return
    const workspace = explicitWorkspaceForGroup(group)
    if (preferences.browseMode === 'project'
      && workspace !== undefined
      && workspace.sessionIds.includes(dragged.entry.summary.id)) {
      run(moveSession(workspace.workspaceId, dragged.entry.summary.id))
    } else if (workspace === undefined) {
      const current = [...new Set([...(preferences.manualSessions[group.key] ?? []), ...group.sessions.map(item => String(item.summary.id))])]
      patchPreferences({
        manualSessions: {
          ...preferences.manualSessions,
          [group.key]: moveKeyBefore(current, String(dragged.entry.summary.id)),
        },
      })
    }
    setDragged(undefined)
  }

  const focusAdjacentSession = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    const target = event.target as HTMLElement
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) return
    const rows = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('.sg_sessionOpen')]
    if (rows.length === 0) return
    const currentIndex = rows.indexOf(document.activeElement as HTMLButtonElement)
    const nextIndex = event.key === 'ArrowDown'
      ? Math.min(rows.length - 1, currentIndex < 0 ? 0 : currentIndex + 1)
      : Math.max(0, currentIndex < 0 ? rows.length - 1 : currentIndex - 1)
    event.preventDefault()
    rows[nextIndex]?.focus()
  }

  const blurClosedMenuOnLeave = (event: MouseEvent<HTMLElement>) => {
    const active = document.activeElement
    if (!(active instanceof HTMLElement) || active.tagName !== 'SUMMARY' || !event.currentTarget.contains(active)) return
    const menu = active.closest('details')
    if (menu?.open !== true) active.blur()
  }

  const placeMenuWithinScroller = (event: SyntheticEvent<HTMLDetailsElement>) => {
    const menu = event.currentTarget
    if (!menu.open) {
      delete menu.dataset.placement
      menu.style.removeProperty('--sg-menu-max-height')
      return
    }

    const panel = menu.querySelector<HTMLElement>('.sg_menuPanel')
    const scroller = menu.closest<HTMLElement>('.sg_groups')
    if (panel === null || scroller === null) return

    delete menu.dataset.placement
    menu.style.removeProperty('--sg-menu-max-height')
    const anchorRect = menu.getBoundingClientRect()
    const scrollerRect = scroller.getBoundingClientRect()
    const naturalHeight = panel.scrollHeight + 10
    const spaceBelow = Math.max(0, scrollerRect.bottom - anchorRect.bottom - 4)
    const spaceAbove = Math.max(0, anchorRect.top - scrollerRect.top - 4)
    const opensUp = naturalHeight > spaceBelow && spaceAbove > spaceBelow
    const available = opensUp ? spaceAbove : spaceBelow

    menu.dataset.placement = opensUp ? 'up' : 'down'
    menu.style.setProperty('--sg-menu-max-height', `${Math.max(40, available)}px`)
  }

  const renderActivityDetails = (entry: BrowserSession) => {
    const catalog = sessions.subagentsByParent[entry.summary.id]
    return (
      <div className="sg_activityDetails">
        <div className="sg_activityHeading">
          <strong>后台活动</strong>
          <button type="button" title="刷新 Subagent" onClick={() => { run(refreshSubagents(entry.summary.id)) }}><IconRefreshOutline14 /></button>
        </div>
        {entry.jobs.map(job => (
          <div className="sg_job" key={job.id} title={job.detail}>
            <span className={`sg_jobStatus sg_jobStatus-${job.status}`}>{job.status}</span>
            <span className="sg_jobLabel">{job.label || job.kind}</span>
            <span className="sg_jobTime">{duration(job.startedAt, job.finishedAt, now)}</span>
            {job.detail === undefined ? null : <span className="sg_jobDetail">{job.detail}</span>}
          </div>
        ))}
        {catalog?.entries.map(item => item.kind === 'child' ? (
          <button
            className="sg_subagent"
            type="button"
            key={item.id}
            onClick={() => { openSubagent({ parentSessionId: entry.summary.id, childSessionId: item.id, mode: item.mode }) }}
          >
            <span className={`sg_subagentStatus sg_subagentStatus-${item.activity}`} />
            <span>{item.label ?? `Subagent ${item.id}`}</span>
            <span>{item.mode === 'continuable' ? '可继续' : '一次性'}</span>
          </button>
        ) : (
          <div className="sg_job" key={item.id}>Subagent {item.id}：{item.reason}</div>
        ))}
        {entry.jobs.length === 0 && (catalog === undefined || catalog.entries.length === 0)
          ? <p className="sg_empty">暂无后台 Job 或 Subagent</p>
          : null}
        {catalog?.state === 'error' ? <p className="sg_error">Subagent 列表读取失败</p> : null}
      </div>
    )
  }

  const renderSession = (entry: BrowserSession, group: BrowserGroup) => {
    const current = entry.summary.id === sessions.current
    const expanded = expandedActivity.has(entry.summary.id)
    const snippet = contentHits.get(entry.summary.id)
    const explicitSource = explicitSourceLabel(entry)
    const counterpart = surface === 'activity' || surface === 'archive'
      ? explicitSource === undefined ? entry.project.title : `${entry.project.title} · ${explicitSource}`
      : preferences.browseMode === 'project' ? explicitSource : entry.project.title
    const pinned = preferences.pinnedSessions.includes(String(entry.summary.id))
    const sessionDraggable = canDragSession(entry, group)
    const compact = counterpart === undefined && snippet === undefined
    const showAttentionDot = entry.attention === 'waiting' || entry.attention === 'failed'
    const wrapClassName = [
      'sg_sessionWrap',
      current ? 'sg_sessionCurrent' : '',
      entry.unread ? 'sg_sessionUnread' : 'sg_sessionRead',
      compact ? 'sg_sessionCompact' : '',
    ].filter(Boolean).join(' ')
    return (
      <div
        className={wrapClassName}
        key={entry.summary.id}
        draggable={sessionDraggable}
        onDragStart={() => { setDragged({ type: 'session', entry, groupKey: group.key }) }}
        onDragOver={event => {
          if (sessionDraggable && dragged?.type === 'session' && dragged.groupKey === group.key) event.preventDefault()
        }}
        onDrop={event => { dropSession(event, entry, group) }}
        onMouseLeave={blurClosedMenuOnLeave}
      >
        <div className="sg_session">
          {manageMode ? (
            <input
              className="sg_select"
              type="checkbox"
              checked={selected.has(entry.summary.id)}
              aria-label={`选择 ${entry.summary.displayTitle}`}
              onChange={() => { toggleSelected(entry.summary.id) }}
            />
          ) : null}
          <button
            className="sg_sessionOpen"
            type="button"
            title={metadata(entry)}
            aria-current={current ? 'page' : undefined}
            aria-label={`${entry.summary.displayTitle}，${entry.unread ? '未读' : '已读'}${entry.running ? '，正在运行' : ''}`}
            onClick={() => { open(entry.summary.id) }}
          >
            {pinned ? <span className="sg_pinMark" aria-label="已置顶">★</span> : null}
            <span className="sg_sessionText">
              <span className="sg_sessionTitle">{entry.summary.blank ? '新会话' : entry.summary.displayTitle}</span>
              {counterpart === undefined ? null : <span className="sg_sessionMeta">{counterpart}</span>}
              {snippet === undefined ? null : <span className="sg_snippet">{snippet}</span>}
            </span>
            {!entry.running && !showAttentionDot && !entry.unread ? null : (
              <span className="sg_statusSlot">
                {entry.running ? <span className="sg_spinner" role="img" title="正在运行" aria-label="正在运行" /> : null}
                {showAttentionDot ? <span className={`sg_dot sg_dot-${entry.attention}`} role="img" title={pendingLabel(entry)} aria-label={pendingLabel(entry)} /> : null}
                {entry.unread ? <span className="sg_unreadDot" role="img" title="未读" aria-label="未读" /> : null}
              </span>
            )}
          </button>
          <div className="sg_sessionHoverActions">
            {surface === 'archive' ? null : (
              <button
                className="sg_quickArchive"
                type="button"
                title="归档"
                aria-label={`归档 ${entry.summary.displayTitle}`}
                onClick={() => { run(archiveSession(entry.summary.id)) }}
              ><IconArchiveOutline20 size={16} /></button>
            )}
            <details className="sg_menu" onToggle={placeMenuWithinScroller}>
              <summary title="更多会话操作" aria-label="更多会话操作"><IconEllipsisOutline16 /></summary>
              <div className="sg_menuPanel">
                <button type="button" onClick={() => { togglePinnedSession(entry.summary.id) }}>{pinned ? '取消置顶' : '置顶'}</button>
                <button type="button" onClick={() => { toggleSessionActivity(entry) }}>{expanded ? '收起活动' : '查看 Job 与 Subagent'}</button>
                {entry.project.path === undefined ? null : <button type="button" onClick={() => { run(openPath(entry.project.path!)) }}>打开项目文件夹</button>}
                {entry.source.rawSource === undefined ? null : <button type="button" onClick={() => {
                  setSurface('browse')
                  setQuery('')
                  patchPreferences({ browseMode: 'source', attentionFilter: 'all', sourceFilter: entry.source.familyKey, chatFilter: '', updatedRange: 'any' })
                }}>查看此来源的全部会话</button>}
                {entry.source.chatTitle === undefined ? null : <button type="button" onClick={() => {
                  setSurface('browse')
                  setQuery('')
                  patchPreferences({ browseMode: 'source', attentionFilter: 'all', sourceFilter: entry.source.familyKey, chatFilter: entry.source.chatKey, updatedRange: 'any' })
                }}>查看此聊天的全部会话</button>}
                <button type="button" onClick={() => { setBrowseMode('project') }}>按项目查看</button>
                {surface === 'archive' ? null : <button type="button" onClick={() => { run(renameSession(entry.summary.id, entry.summary.displayTitle)) }}>重命名</button>}
                {surface === 'archive' ? null : <button type="button" onClick={() => { run(forkSession(entry.summary.id)) }}>分叉会话</button>}
                {surface === 'archive' ? null : <button type="button" onClick={() => { run(archiveSession(entry.summary.id)) }}>归档</button>}
              </div>
            </details>
          </div>
        </div>
        {expanded ? renderActivityDetails(entry) : null}
      </div>
    )
  }

  const renderGroup = (group: BrowserGroup, depth: number, siblings: readonly BrowserGroup[], parentKey?: string) => {
    const folded = collapsed.has(group.key)
    const workspaceId = group.workspaceId
    const pinned = surface !== 'activity' && preferences.pinnedGroups[preferences.browseMode].includes(group.key)
    const kindLabel = sessionGroupKindLabel(group.providerKind)
    const fullGroup = fullGroupIndex.get(group.key)
    const total = fullGroup === undefined ? groupSize(group) : groupSize(fullGroup)
    const visible = groupSize(group)
    const counts = fullGroup?.counts ?? group.counts
    const hasContent = group.sessions.length > 0 || (group.children?.length ?? 0) > 0
    return (
      <section className={`sg_group sg_groupDepth-${Math.min(depth, 2)}`} key={group.key}>
        <div
          className={workspaceId === undefined ? 'sg_groupHead' : 'sg_groupHead sg_groupHeadStartable'}
          draggable={canDrag}
          onDragStart={() => { setDragged({ type: 'group', group, ...(parentKey === undefined ? {} : { parentKey }) }) }}
          onDragOver={event => { if (canDrag) event.preventDefault() }}
          onDrop={event => { dropGroup(event, group, siblings.map(item => item.key), parentKey) }}
          onMouseLeave={blurClosedMenuOnLeave}
        >
          <button
            className={hasContent ? 'sg_groupToggle' : 'sg_groupToggle sg_groupToggleEmpty'}
            type="button"
            aria-expanded={hasContent ? !folded : undefined}
            title={hasContent ? folded ? '展开分组' : '收起分组' : '空分组'}
            onClick={() => { if (hasContent) toggleCollapsed(group.key) }}
          >
            <span className="sg_groupIcon" aria-hidden><SessionGroupIcon source={group.source} folded={folded} /></span>
            {pinned ? <span className="sg_pinMark" aria-label="已置顶">★</span> : null}
            <span className="sg_groupTitle" title={group.title}>{group.title}</span>
            {kindLabel === undefined ? null : <span className="sg_kind">{kindLabel}</span>}
            {counts.waiting > 0 ? <span className="sg_attentionCount sg_attentionCount-waiting">待 {counts.waiting}</span> : null}
            {counts.failed > 0 ? <span className="sg_attentionCount sg_attentionCount-failed">失败 {counts.failed}</span> : null}
            {counts.running > 0 ? <span className="sg_attentionCount sg_attentionCount-running">运行 {counts.running}</span> : null}
            {counts.unread > 0 ? <span className="sg_attentionCount sg_attentionCount-unread">未读 {counts.unread}</span> : null}
            <span className="sg_count" title={hasActiveFilters ? `${visible} 个筛选命中，共 ${total} 个会话` : undefined}>{hasActiveFilters ? `${visible}/${total}` : total}</span>
          </button>
          {workspaceId === undefined ? null : (
            <button
              className="sg_groupStart"
              type="button"
              title="新建会话"
              aria-label={`在 ${group.title} 中新建会话`}
              onClick={() => { startSession(workspaceId) }}
            ><IconPlusOutline16 /></button>
          )}
          <details className="sg_menu sg_groupMenu" onToggle={placeMenuWithinScroller}>
            <summary title="分组操作" aria-label="分组操作"><IconEllipsisOutline16 /></summary>
            <div className="sg_menuPanel">
              {surface === 'activity' ? null : <button type="button" onClick={() => { togglePinnedGroup(group.key) }}><IconPinOutline16 />{pinned ? '取消置顶' : '置顶'}</button>}
              {group.path === undefined ? null : <button type="button" onClick={() => { run(openPath(group.path!)) }}><IconFolderOpenOutline16 />打开文件夹</button>}
              {workspaceId === undefined ? null : <button type="button" onClick={() => { startSession(workspaceId) }}><IconPlusOutline16 />新建会话</button>}
              {workspaceId === undefined ? null : <button type="button" onClick={() => { run(renameWorkspace(workspaceId, group.title)) }}><IconEditOutline16 />重命名 Workspace</button>}
              {workspaceId === undefined ? null : <button type="button" onClick={() => { run(deleteWorkspace(workspaceId, group.title)) }}><IconTrashOutline16 />删除 Workspace 注册</button>}
            </div>
          </details>
        </div>
        {folded || !hasContent ? null : (
          <div className="sg_groupBody">
            {group.sessions.map(entry => renderSession(entry, group))}
            {canDrag && group.sessions.some(entry => canDragSession(entry, group)) ? <div className="sg_dropEnd" onDragOver={event => {
              if (dragged?.type === 'session' && dragged.groupKey === group.key) event.preventDefault()
            }} onDrop={event => { dropSessionAtEnd(event, group) }} /> : null}
            {group.children?.map(child => renderGroup(child, depth + 1, group.children!, group.key))}
            {canDrag && group.children !== undefined && group.children.length > 0 ? <div className="sg_dropEnd" onDragOver={event => { event.preventDefault() }} onDrop={event => { dropGroupAtEnd(event, group.children!, group.key) }} /> : null}
          </div>
        )}
      </section>
    )
  }

  const visibleIds = renderedSessionIds(groups, collapsed)
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selected.has(id))

  return (
    <section className={dragged === undefined ? 'sg_root' : 'sg_root sg_dragging'} aria-label="任务浏览器" onKeyDown={focusAdjacentSession}>
      <header className="sg_header">
        <strong>会话</strong>
        <div className="sg_headerActions">
          <button className={manageMode ? 'sg_textButton sg_textButtonActive' : 'sg_textButton'} type="button" onClick={() => { setManageMode(value => !value); setSelected(new Set()) }}>管理</button>
          <button className="sg_iconButton" type="button" title="添加 Workspace" aria-label="添加 Workspace" onClick={() => { run(addWorkspace()) }}><IconPlusOutline16 /></button>
        </div>
      </header>

      <nav className="sg_views" aria-label="浏览方式">
        <button className={surface === 'browse' && preferences.browseMode === 'project' ? 'sg_viewActive' : ''} type="button" onClick={() => { setBrowseMode('project') }}>按项目</button>
        <button className={surface === 'browse' && preferences.browseMode === 'source' ? 'sg_viewActive' : ''} type="button" onClick={() => { setBrowseMode('source') }}>按来源</button>
        <button className={surface === 'activity' ? 'sg_viewActive' : ''} type="button" onClick={() => { setSurface('activity') }}>Activity</button>
        <button className={surface === 'archive' ? 'sg_viewActive' : ''} type="button" onClick={() => { setSurface('archive') }}>归档</button>
      </nav>

      <div className="sg_searchWrap">
        <input
          ref={searchRef}
          className="sg_search"
          type="search"
          value={query}
          placeholder="搜索标题或对话正文  ⌘K"
          onChange={event => { setQuery(event.currentTarget.value) }}
        />
        <button className={filtersOpen || hasActiveFilters ? 'sg_filterButton sg_filterButtonActive' : 'sg_filterButton'} type="button" onClick={() => { setFiltersOpen(value => !value) }}>筛选</button>
      </div>

      {statusCounts.waiting + statusCounts.failed + statusCounts.running + statusCounts.unread > 0
        || preferences.attentionFilter !== 'all' ? <div className="sg_quickFilters" aria-label="任务状态筛选">
        {([
          ['all', '全部', quickEntries.length],
          ['waiting', '待我处理', statusCounts.waiting],
          ['failed', '失败', statusCounts.failed],
          ['running', '运行中', statusCounts.running],
          ['completed', '未读', statusCounts.unread],
        ] as const).filter(([value, , count]) => value === 'all' || count > 0 || preferences.attentionFilter === value).map(([value, label, count]) => (
          <button
            className={preferences.attentionFilter === value ? 'sg_chip sg_chipActive' : 'sg_chip'}
            type="button"
            key={value}
            onClick={() => { patchPreferences({ attentionFilter: value }) }}
          >{label} {count}</button>
        ))}
      </div> : null}

      {filtersOpen ? (
        <div className="sg_filters">
          <label>状态
            <select value={preferences.attentionFilter} onChange={event => { patchPreferences({ attentionFilter: event.currentTarget.value as BrowserPreferences['attentionFilter'] }) }}>
              <option value="all">全部</option><option value="waiting">等待用户</option><option value="failed">后台失败</option><option value="running">运行中</option><option value="completed">未读（已完成）</option>
            </select>
          </label>
          <label>来源
            <select value={preferences.sourceFilter} onChange={event => { patchPreferences({ sourceFilter: event.currentTarget.value, chatFilter: '' }) }}>
              <option value="">全部来源</option>
              {sourceOptions.map(([key, title]) => <option key={key} value={key}>{title}</option>)}
            </select>
          </label>
          <label>聊天
            <select value={preferences.chatFilter} onChange={event => { patchPreferences({ chatFilter: event.currentTarget.value }) }}>
              <option value="">全部聊天</option>
              {chatOptions.map(([key, title]) => <option key={key} value={key}>{title}</option>)}
            </select>
          </label>
          <label>更新时间
            <select value={preferences.updatedRange} onChange={event => { patchPreferences({ updatedRange: event.currentTarget.value as BrowserPreferences['updatedRange'] }) }}>
              <option value="any">不限</option><option value="day">24 小时内</option><option value="week">7 天内</option><option value="month">30 天内</option>
            </select>
          </label>
          <label>排序
            <select value={preferences.sortMode} onChange={event => { patchPreferences({ sortMode: event.currentTarget.value as BrowserPreferences['sortMode'] }) }}>
              <option value="manual">手动</option><option value="recent">最近更新</option><option value="name">名称</option><option value="status">状态</option>
            </select>
          </label>
          <button type="button" onClick={clearFilters}>清除筛选</button>
        </div>
      ) : null}

      {manageMode ? (
        <div className="sg_bulkBar">
          <label><input type="checkbox" checked={allVisibleSelected} onChange={() => { setSelected(allVisibleSelected ? new Set() : new Set(visibleIds)) }} />选择当前结果</label>
          <span>已选 {selected.size}</span>
          {surface === 'archive' ? (
            <span title="当前 DSH Runtime 尚未提供恢复或永久删除 API">恢复/永久删除暂不可用</span>
          ) : (
            <button type="button" disabled={selected.size === 0} onClick={confirmArchiveSelected}><IconArchiveOutline20 size={16} />批量归档</button>
          )}
        </div>
      ) : null}

      {remote.loading ? <p className="sg_status">正在读取来源信息…</p> : null}
      {remote.error !== undefined ? <p className="sg_error" title={remote.error}>{sessionGroupsErrorMessage(remote.error)}</p> : null}
      {actionError !== undefined ? <p className="sg_error" title={actionError}>操作失败：{actionError}</p> : null}
      {searchError !== undefined ? <p className="sg_error" title={searchError}>正文搜索失败，已保留本地结果</p> : null}
      {searching ? <p className="sg_status">正在搜索对话正文…</p> : null}
      {searchHasMore ? <p className="sg_status">结果较多，请继续细化关键词</p> : null}
      {surface === 'archive' ? <p className="sg_notice">归档会话可搜索和查看；当前 DSH Runtime 尚未提供安全的恢复或永久删除 API。</p> : null}

      <div className="sg_groups">
        {groups.map(group => renderGroup(group, 0, groups))}
        {canDrag && groups.length > 0 ? <div className="sg_dropEnd sg_dropEndGroups" onDragOver={event => { event.preventDefault() }} onDrop={event => { dropGroupAtEnd(event, groups) }} /> : null}
        {groups.length === 0 ? (
          <div className="sg_emptyState">
            <p>{surface === 'activity' ? '当前没有需要关注的任务' : surface === 'archive' ? '没有归档会话' : '没有匹配的会话'}</p>
            {hasActiveFilters ? <button type="button" onClick={clearFilters}>清除筛选</button> : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
