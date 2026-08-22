/** Pure browser projections: project context and provider source stay independent. */
import type {
  JobView,
  SessionId,
  SessionListState,
  SessionSummary,
  WorkspaceId,
  WorkspaceView,
} from '@deepseek-ai/dsh-client-runtime/client'
import type { SessionGroupAssignment } from '../types.js'
import { resolveSourceFamily } from './source-icon-key.js'

export type BrowseMode = 'project' | 'source'
export type SessionAttention = 'waiting' | 'failed' | 'running' | 'completed' | 'idle'

export interface ProjectContext {
  readonly key: string
  readonly kind: 'workspace' | 'directory' | 'none'
  readonly title: string
  readonly path?: string
  readonly workspaceId?: WorkspaceId
}

export interface SourceContext {
  readonly familyKey: string
  readonly familyTitle: string
  readonly iconSource?: string
  readonly chatKey: string
  readonly rawSource?: string
  readonly chatId?: string
  readonly chatTitle?: string
  readonly kind?: string
}

export interface BrowserSession {
  readonly summary: SessionSummary
  readonly project: ProjectContext
  readonly source: SourceContext
  readonly attention: SessionAttention
  readonly jobs: readonly JobView[]
  readonly archived: boolean
}

export interface StatusCounts {
  readonly waiting: number
  readonly failed: number
  readonly running: number
  readonly completed: number
  readonly idle: number
}

export type BrowserGroupType = 'project' | 'source' | 'chat' | 'activity'

/** One rendered sidebar level. Source mode uses source groups containing chat children. */
export interface BrowserGroup {
  readonly key: string
  readonly type: BrowserGroupType
  readonly title: string
  readonly source?: string
  readonly providerKind?: string
  readonly workspaceId?: WorkspaceId
  readonly path?: string
  readonly sessions: readonly BrowserSession[]
  readonly children?: readonly BrowserGroup[]
  readonly counts: StatusCounts
}

const UNATTRIBUTED_SOURCE: SourceContext = Object.freeze({
  familyKey: 'source:unattributed',
  familyTitle: '本地或未标注来源',
  chatKey: 'chat:unattributed',
})

/** Human-facing badges for group-like provider categories. Private titles stay provider-owned. */
export function sessionGroupKindLabel(kind: string | undefined): string | undefined {
  switch (kind?.trim().toLocaleLowerCase().replaceAll('_', '-')) {
    case 'group':
    case 'group-chat':
      return '群聊'
    case 'topic':
    case 'topic-group':
      return '话题群'
    default:
      return undefined
  }
}

function visible(session: SessionSummary, current: SessionId | undefined): boolean {
  return session.origin !== 'subagent' && (!session.blank || session.id === current)
}

export function newestFirst(left: BrowserSession, right: BrowserSession): number {
  if (left.summary.updatedAt !== right.summary.updatedAt) return right.summary.updatedAt - left.summary.updatedAt
  return left.summary.id < right.summary.id ? -1 : 1
}

/** Portable normalization used only for browser grouping keys and boundary-safe comparisons. */
export function normalizePathForGrouping(path: string): string {
  const raw = path.trim().replaceAll('\\', '/')
  const unc = raw.startsWith('//')
  let normalized = raw.replace(/\/{2,}/g, '/')
  if (unc) normalized = `/${normalized}`
  if (/^[A-Za-z]:$/.test(normalized)) normalized += '/'
  const driveRoot = /^[A-Za-z]:\/$/.test(normalized)
  if (normalized.length > 1 && !driveRoot) normalized = normalized.replace(/\/+$/, '')
  if (/^[A-Za-z]:\//.test(normalized) || normalized.startsWith('//')) normalized = normalized.toLocaleLowerCase()
  return normalized
}

/** True for the same path or a descendant, never for a shared string prefix such as bar/bar2. */
export function isPathWithin(path: string, parent: string): boolean {
  const child = normalizePathForGrouping(path)
  const root = normalizePathForGrouping(parent)
  if (child === '' || root === '') return false
  if (child === root) return true
  return root.endsWith('/') ? child.startsWith(root) : child.startsWith(`${root}/`)
}

function basename(path: string): string {
  const normalized = normalizePathForGrouping(path)
  const segments = normalized.split('/').filter(Boolean)
  return segments.at(-1) ?? normalized
}

function projectFromWorkspace(workspace: WorkspaceView): ProjectContext {
  return {
    key: `project:workspace:${workspace.workspaceId}`,
    kind: 'workspace',
    title: workspace.title,
    path: workspace.path,
    workspaceId: workspace.workspaceId,
  }
}

/** Resolve explicit Workspace accounting first, then the most specific path, then a read-only cwd group. */
export function resolveProjectContext(
  session: SessionSummary,
  workspaces: readonly WorkspaceView[],
  explicitWorkspace?: WorkspaceView,
): ProjectContext {
  if (explicitWorkspace !== undefined) return projectFromWorkspace(explicitWorkspace)
  if (session.cwd === undefined || session.cwd.trim() === '') {
    return { key: 'project:none', kind: 'none', title: '无项目' }
  }

  let matched: WorkspaceView | undefined
  let matchedLength = -1
  for (const workspace of workspaces) {
    if (!isPathWithin(session.cwd, workspace.path)) continue
    const length = normalizePathForGrouping(workspace.path).length
    if (length > matchedLength) {
      matched = workspace
      matchedLength = length
    }
  }
  if (matched !== undefined) return projectFromWorkspace(matched)

  const normalized = normalizePathForGrouping(session.cwd)
  return {
    key: `project:directory:${normalized}`,
    kind: 'directory',
    title: basename(session.cwd) || session.cwd,
    path: session.cwd,
  }
}

export function deriveSessionAttention(session: SessionSummary, jobs: readonly JobView[]): SessionAttention {
  if (session.pendingInteraction !== undefined) return 'waiting'
  if (jobs.some(job => job.status === 'failed')) return 'failed'
  if (session.running || jobs.some(job => job.status === 'running' || job.status === 'stopping')) return 'running'
  if (session.completed === true) return 'completed'
  return 'idle'
}

function sourceContexts(assignments: readonly SessionGroupAssignment[]): ReadonlyMap<SessionId, SourceContext> {
  const newestBySession = new Map<SessionId, SessionGroupAssignment>()
  const newestByChat = new Map<string, SessionGroupAssignment>()
  for (const assignment of assignments) {
    const currentSession = newestBySession.get(assignment.sessionId)
    if (currentSession === undefined || assignment.updatedAt >= currentSession.updatedAt) {
      newestBySession.set(assignment.sessionId, assignment)
    }
    const chatKey = `${assignment.group.source}\u0000${assignment.group.id}`
    const currentChat = newestByChat.get(chatKey)
    if (currentChat === undefined || assignment.updatedAt >= currentChat.updatedAt) newestByChat.set(chatKey, assignment)
  }

  const result = new Map<SessionId, SourceContext>()
  for (const [sessionId, assignment] of newestBySession) {
    const rawSource = assignment.group.source
    const chatIdentity = `${rawSource}\u0000${assignment.group.id}`
    const descriptor = newestByChat.get(chatIdentity)?.group ?? assignment.group
    const family = resolveSourceFamily(rawSource)
    result.set(sessionId, {
      familyKey: `source:${family.key}`,
      familyTitle: family.title,
      iconSource: family.iconSource,
      chatKey: `chat:${chatIdentity}`,
      rawSource,
      chatId: String(descriptor.id),
      chatTitle: descriptor.title,
      ...(descriptor.kind === undefined ? {} : { kind: descriptor.kind }),
    })
  }
  return result
}

const warnedWorkspaceConflicts = new Set<string>()

function warnWorkspaceConflict(
  sessionId: SessionId,
  selected: WorkspaceView,
  conflicting: WorkspaceView,
): void {
  const key = `${sessionId}\u0000${selected.workspaceId}\u0000${conflicting.workspaceId}`
  if (warnedWorkspaceConflicts.has(key)) return
  warnedWorkspaceConflicts.add(key)
  console.warn(
    `[dsh-session-groups] Session "${sessionId}" belongs to multiple Workspaces; `
      + `using "${selected.title}" (${selected.workspaceId}) before "${conflicting.title}" (${conflicting.workspaceId}).`,
  )
}

/** Derive all root-session rows once; every view is a non-mutating projection over these entries. */
export function deriveBrowserSessions(
  list: SessionListState,
  workspaces: readonly WorkspaceView[],
  archivedSessionIds: readonly SessionId[],
  assignments: readonly SessionGroupAssignment[],
): BrowserSession[] {
  const archived = new Set(archivedSessionIds)
  const explicitWorkspaceBySession = new Map<SessionId, WorkspaceView>()
  for (const workspace of workspaces) {
    for (const sessionId of workspace.sessionIds) {
      const existing = explicitWorkspaceBySession.get(sessionId)
      if (existing === undefined) {
        explicitWorkspaceBySession.set(sessionId, workspace)
      } else if (existing.workspaceId !== workspace.workspaceId) {
        warnWorkspaceConflict(sessionId, existing, workspace)
      }
    }
  }
  const sources = sourceContexts(assignments)
  return list.ids
    .map(id => list.byId[id])
    .filter((session): session is SessionSummary => session !== undefined && visible(session, list.current))
    .map(summary => {
      const jobs = list.jobsBySession[summary.id] ?? []
      return {
        summary,
        project: resolveProjectContext(summary, workspaces, explicitWorkspaceBySession.get(summary.id)),
        source: sources.get(summary.id) ?? UNATTRIBUTED_SOURCE,
        attention: deriveSessionAttention(summary, jobs),
        jobs,
        archived: archived.has(summary.id),
      }
    })
}

export function countStatuses(sessions: readonly BrowserSession[]): StatusCounts {
  const mutable = { waiting: 0, failed: 0, running: 0, completed: 0, idle: 0 }
  for (const session of sessions) mutable[session.attention] += 1
  return mutable
}

function makeGroup(input: Omit<BrowserGroup, 'counts'>): BrowserGroup {
  const allSessions = input.children === undefined
    ? input.sessions
    : [...input.sessions, ...input.children.flatMap(child => child.sessions)]
  return { ...input, counts: countStatuses(allSessions) }
}

function deriveProjectGroups(entries: readonly BrowserSession[], workspaces: readonly WorkspaceView[]): BrowserGroup[] {
  const byProject = new Map<string, BrowserSession[]>()
  for (const entry of entries) {
    const bucket = byProject.get(entry.project.key)
    if (bucket === undefined) byProject.set(entry.project.key, [entry])
    else bucket.push(entry)
  }

  const result: BrowserGroup[] = []
  for (const workspace of workspaces) {
    const project = projectFromWorkspace(workspace)
    const sessionOrder = new Map(workspace.sessionIds.map((id, index) => [id, index]))
    const sessions = (byProject.get(project.key) ?? []).toSorted((left, right) => {
      const leftIndex = sessionOrder.get(left.summary.id)
      const rightIndex = sessionOrder.get(right.summary.id)
      if (leftIndex === undefined && rightIndex === undefined) return newestFirst(left, right)
      if (leftIndex === undefined) return 1
      if (rightIndex === undefined) return -1
      return leftIndex - rightIndex
    })
    result.push(makeGroup({
      key: project.key,
      type: 'project',
      title: project.title,
      workspaceId: workspace.workspaceId,
      path: workspace.path,
      sessions,
    }))
    byProject.delete(project.key)
  }

  const derived = [...byProject.entries()].map(([key, sessions]) => {
    const project = sessions[0]!.project
    return makeGroup({
      key,
      type: 'project',
      title: project.title,
      ...(project.path === undefined ? {} : { path: project.path }),
      sessions: sessions.toSorted(newestFirst),
    })
  })
  derived.sort((left, right) => {
    if (left.key === 'project:none') return 1
    if (right.key === 'project:none') return -1
    const activity = (right.sessions[0]?.summary.updatedAt ?? 0) - (left.sessions[0]?.summary.updatedAt ?? 0)
    return activity === 0 ? left.title.localeCompare(right.title) : activity
  })
  return [...result, ...derived]
}

function deriveSourceGroups(entries: readonly BrowserSession[]): BrowserGroup[] {
  const familyBuckets = new Map<string, BrowserSession[]>()
  for (const entry of entries) {
    const bucket = familyBuckets.get(entry.source.familyKey)
    if (bucket === undefined) familyBuckets.set(entry.source.familyKey, [entry])
    else bucket.push(entry)
  }

  const groups = [...familyBuckets.entries()].map(([familyKey, sessions]) => {
    const source = sessions[0]!.source
    if (familyKey === UNATTRIBUTED_SOURCE.familyKey) {
      return makeGroup({
        key: familyKey,
        type: 'source',
        title: source.familyTitle,
        sessions: sessions.toSorted(newestFirst),
      })
    }

    const chats = new Map<string, BrowserSession[]>()
    for (const session of sessions) {
      const bucket = chats.get(session.source.chatKey)
      if (bucket === undefined) chats.set(session.source.chatKey, [session])
      else bucket.push(session)
    }
    const children = [...chats.entries()].map(([chatKey, chatSessions]) => {
      const chat = chatSessions[0]!.source
      return makeGroup({
        key: chatKey,
        type: 'chat',
        title: chat.chatTitle ?? '未命名聊天',
        ...(chat.iconSource === undefined ? {} : { source: chat.iconSource }),
        ...(chat.kind === undefined ? {} : { providerKind: chat.kind }),
        sessions: chatSessions.toSorted(newestFirst),
      })
    }).sort((left, right) => {
      const activity = (right.sessions[0]?.summary.updatedAt ?? 0) - (left.sessions[0]?.summary.updatedAt ?? 0)
      return activity === 0 ? left.title.localeCompare(right.title) : activity
    })
    return makeGroup({
      key: familyKey,
      type: 'source',
      title: source.familyTitle,
      ...(source.iconSource === undefined ? {} : { source: source.iconSource }),
      sessions: [],
      children,
    })
  })
  groups.sort((left, right) => {
    if (left.key === UNATTRIBUTED_SOURCE.familyKey) return 1
    if (right.key === UNATTRIBUTED_SOURCE.familyKey) return -1
    const leftTime = Math.max(0, ...left.children!.flatMap(child => child.sessions.map(item => item.summary.updatedAt)))
    const rightTime = Math.max(0, ...right.children!.flatMap(child => child.sessions.map(item => item.summary.updatedAt)))
    return leftTime === rightTime ? left.title.localeCompare(right.title) : rightTime - leftTime
  })
  return groups
}

export function groupBrowserSessions(
  entries: readonly BrowserSession[],
  workspaces: readonly WorkspaceView[],
  mode: BrowseMode,
): BrowserGroup[] {
  return mode === 'project' ? deriveProjectGroups(entries, workspaces) : deriveSourceGroups(entries)
}

/** Build either project-first or source-first groups without changing either underlying identity. */
export function deriveBrowserGroups(
  list: SessionListState,
  workspaces: readonly WorkspaceView[],
  archivedSessionIds: readonly SessionId[],
  assignments: readonly SessionGroupAssignment[],
  mode: BrowseMode = 'project',
  includeArchived = false,
): BrowserGroup[] {
  const entries = deriveBrowserSessions(list, workspaces, archivedSessionIds, assignments)
    .filter(entry => entry.archived === includeArchived)
  return groupBrowserSessions(entries, workspaces, mode)
}
