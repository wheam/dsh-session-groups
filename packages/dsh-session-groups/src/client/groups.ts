/** Pure browser grouping: virtual assignments take precedence over real Workspace accounting. */
import type {
  SessionId,
  SessionListState,
  SessionSummary,
  WorkspaceId,
  WorkspaceView,
} from '@deepseek-ai/dsh-client-runtime/client'
import type { SessionGroupAssignment } from '../types.js'

/** One rendered sidebar group. */
export interface BrowserGroup {
  readonly key: string
  readonly title: string
  readonly source?: string
  readonly kind?: string
  readonly workspaceId?: WorkspaceId
  readonly sessions: readonly SessionSummary[]
}

function visible(session: SessionSummary, current: SessionId | undefined, archived: ReadonlySet<SessionId>): boolean {
  return session.origin !== 'subagent'
    && !archived.has(session.id)
    && (!session.blank || session.id === current)
}

function newestFirst(left: SessionSummary, right: SessionSummary): number {
  if (left.updatedAt !== right.updatedAt) return right.updatedAt - left.updatedAt
  return left.id < right.id ? -1 : 1
}

/**
 * Build native Workspace, provider-defined virtual, and final ungrouped rows.
 * A virtual assignment wins even if the Session is also accounted by a real Workspace.
 */
export function deriveBrowserGroups(
  list: SessionListState,
  workspaces: readonly WorkspaceView[],
  archivedSessionIds: readonly SessionId[],
  assignments: readonly SessionGroupAssignment[],
): BrowserGroup[] {
  const archived = new Set(archivedSessionIds)
  const assignmentBySession = new Map(assignments.map(item => [item.sessionId, item]))
  const accounted = new Set<SessionId>()
  const result: BrowserGroup[] = []

  for (const workspace of workspaces) {
    const sessions: SessionSummary[] = []
    for (const id of workspace.sessionIds) {
      accounted.add(id)
      const summary = list.byId[id]
      if (summary === undefined || assignmentBySession.has(id) || !visible(summary, list.current, archived)) continue
      sessions.push(summary)
    }
    result.push({
      key: `workspace:${workspace.workspaceId}`,
      title: workspace.title,
      workspaceId: workspace.workspaceId,
      sessions,
    })
  }

  const virtual = new Map<string, {
    title: string
    source: string
    kind?: string
    descriptorUpdatedAt: number
    sessions: SessionSummary[]
  }>()
  for (const id of list.ids) {
    const summary = list.byId[id]
    const assignment = assignmentBySession.get(id)
    if (summary === undefined || assignment === undefined || !visible(summary, list.current, archived)) continue
    const key = `${assignment.group.source}\u0000${assignment.group.id}`
    const group = virtual.get(key)
    if (group === undefined) {
      virtual.set(key, {
        title: assignment.group.title,
        source: assignment.group.source,
        ...(assignment.group.kind === undefined ? {} : { kind: assignment.group.kind }),
        descriptorUpdatedAt: assignment.updatedAt,
        sessions: [summary],
      })
    } else {
      group.sessions.push(summary)
      if (assignment.updatedAt > group.descriptorUpdatedAt) {
        group.title = assignment.group.title
        group.descriptorUpdatedAt = assignment.updatedAt
      }
    }
  }
  const virtualGroups = [...virtual.entries()].map(([identity, group]) => ({
    key: `virtual:${identity}`,
    title: group.title,
    source: group.source,
    ...(group.kind === undefined ? {} : { kind: group.kind }),
    sessions: group.sessions.toSorted(newestFirst),
  }))
  virtualGroups.sort((left, right) => {
    const leftUpdated = left.sessions[0]?.updatedAt ?? 0
    const rightUpdated = right.sessions[0]?.updatedAt ?? 0
    if (leftUpdated !== rightUpdated) return rightUpdated - leftUpdated
    return left.title.localeCompare(right.title)
  })
  result.push(...virtualGroups)

  const loose = list.ids
    .map(id => list.byId[id])
    .filter((session): session is SessionSummary => session !== undefined
      && !accounted.has(session.id)
      && !assignmentBySession.has(session.id)
      && visible(session, list.current, archived))
    .toSorted(newestFirst)
  if (loose.length > 0) result.push({ key: 'ungrouped', title: '未分组', sessions: loose })
  return result
}
