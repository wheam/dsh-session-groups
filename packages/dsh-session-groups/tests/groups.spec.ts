import { describe, expect, it, vi } from 'vitest'
import type {
  JobView,
  SessionId,
  SessionListState,
  SessionSummary,
  WorkspaceId,
  WorkspaceView,
} from '@deepseek-ai/dsh-client-runtime/client'
import type { SessionGroupAssignment, SessionGroupId } from '../src/types.js'
import {
  deriveBrowserGroups,
  deriveBrowserSessions,
  deriveSessionAttention,
  isPathWithin,
  normalizePathForGrouping,
  resolveProjectContext,
  sessionGroupKindLabel,
} from '../src/client/groups.js'

const sid = (value: string) => value as SessionId
const wid = (value: string) => value as WorkspaceId
const gid = (value: string) => value as SessionGroupId

function summary(id: string, updatedAt: number, input: Partial<SessionSummary> = {}): SessionSummary {
  return {
    id: sid(id),
    displayTitle: id,
    running: false,
    blank: false,
    updatedAt,
    ...input,
  }
}

function list(...items: SessionSummary[]): SessionListState {
  return {
    ids: items.map(item => item.id),
    byId: Object.fromEntries(items.map(item => [item.id, item])) as SessionListState['byId'],
    current: undefined,
    phase: 'ready',
    subagentsByParent: {},
    jobsBySession: {},
    currentAddress: undefined,
  }
}

function workspace(
  id: string,
  path: string,
  title: string,
  ...sessionIds: SessionId[]
): WorkspaceView {
  return {
    workspaceId: wid(id),
    path,
    title,
    sessionIds,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

function assignment(
  sessionId: string,
  groupId: string,
  title: string,
  updatedAt = 1,
  kind = 'topic',
  source = 'feishu',
): SessionGroupAssignment {
  return {
    sessionId: sid(sessionId),
    group: { id: gid(groupId), title, source, kind },
    updatedAt,
  }
}

function job(status: JobView['status']): JobView {
  return {
    id: 'bash-1' as JobView['id'],
    kind: 'bash',
    label: 'test',
    status,
    startedAt: 1,
  }
}

describe('dual-axis browser groups', () => {
  it('keeps a Feishu-origin session in its real Workspace in project mode', () => {
    const first = summary('s1', 10)
    const second = summary('s2', 20)
    const project = workspace('workspace-1', '/tmp/project', 'Project', first.id)
    const groups = deriveBrowserGroups(
      list(first, second),
      [project],
      [],
      [assignment('s1', 'chat-a', '飞书群 A'), assignment('s2', 'chat-a', '飞书群 A')],
      'project',
    )

    expect(groups.map(group => [group.title, group.sessions.map(item => item.summary.id)])).toEqual([
      ['Project', ['s1']],
      ['无项目', ['s2']],
    ])
    expect(groups[0]?.sessions[0]?.source.chatTitle).toBe('飞书群 A')
  })

  it('projects the same sessions by source family and chat without losing projects', () => {
    const first = summary('s1', 10)
    const second = summary('s2', 20, { cwd: '/tmp/other' })
    const groups = deriveBrowserGroups(
      list(first, second),
      [workspace('workspace-1', '/tmp/project', 'Project', first.id)],
      [],
      [assignment('s1', 'chat-a', '旧群名', 1, 'group', 'feishu'), assignment('s2', 'chat-a', '新群名', 2, 'topic', 'lark')],
      'source',
    )

    expect(groups).toHaveLength(1)
    expect(groups[0]?.title).toBe('飞书 / Lark')
    expect(groups[0]?.children?.map(group => group.title)).toEqual(['新群名', '旧群名'])
    expect(groups[0]?.children?.flatMap(group => group.sessions.map(item => item.project.title))).toEqual(['other', 'Project'])
  })

  it('uses the newest descriptor for all sessions sharing an exact source and chat id', () => {
    const entries = deriveBrowserSessions(
      list(summary('s1', 1), summary('s2', 2)),
      [],
      [],
      [assignment('s1', 'chat-a', '旧群名', 1, 'group'), assignment('s2', 'chat-a', '新群名', 2, 'topic')],
    )
    expect(entries.map(entry => [entry.source.chatTitle, entry.source.kind])).toEqual([
      ['新群名', 'topic'],
      ['新群名', 'topic'],
    ])
  })

  it('keeps missing project and missing source as independent concepts', () => {
    const groups = deriveBrowserGroups(list(summary('loose', 1)), [], [], [], 'project')
    expect(groups.map(group => group.title)).toEqual(['无项目'])
    expect(groups[0]?.sessions[0]?.source.familyTitle).toBe('本地或未标注来源')

    const sourceGroups = deriveBrowserGroups(list(summary('loose', 1)), [], [], [], 'source')
    expect(sourceGroups[0]?.title).toBe('本地或未标注来源')
    expect(sourceGroups[0]?.children).toBeUndefined()
    expect(sourceGroups[0]?.sessions[0]?.project.title).toBe('无项目')
  })

  it('can include archived sessions only for the archive surface', () => {
    const state = list(summary('archived', 1))
    expect(deriveBrowserGroups(state, [], [sid('archived')], [], 'project')).toEqual([])
    expect(deriveBrowserGroups(state, [], [sid('archived')], [], 'project', true)[0]?.title).toBe('无项目')
  })
})

describe('project resolution', () => {
  it('prefers explicit Workspace membership even when cwd points elsewhere', () => {
    const explicit = workspace('explicit', '/repo/explicit', 'Explicit')
    const context = resolveProjectContext(summary('s1', 1, { cwd: '/repo/other' }), [explicit], explicit)
    expect(context.title).toBe('Explicit')
  })

  it('uses the most specific path with path-component boundaries', () => {
    const root = workspace('root', '/repo', 'Root')
    const nested = workspace('nested', '/repo/packages/app', 'App')
    expect(resolveProjectContext(summary('s1', 1, { cwd: '/repo/packages/app/src' }), [root, nested]).title).toBe('App')
    expect(isPathWithin('/repo2/file', '/repo')).toBe(false)
    expect(isPathWithin('/repo/file', '/repo')).toBe(true)
  })

  it('normalizes Windows and UNC paths without losing their roots', () => {
    expect(normalizePathForGrouping('C:\\Repo\\App\\')).toBe('c:/repo/app')
    expect(normalizePathForGrouping('\\\\Server\\Share\\App')).toBe('//server/share/app')
    expect(isPathWithin('C:\\Repo\\App', 'c:\\repo')).toBe(true)
    expect(normalizePathForGrouping('C:\\')).toBe('c:/')
    expect(isPathWithin('C:\\Repo\\App', 'c:\\')).toBe(true)
  })

  it('uses the first explicit Workspace and diagnoses duplicate membership once', () => {
    const session = summary('conflict-warning-test', 1)
    const first = workspace('first', '/first', 'First', session.id)
    const second = workspace('second', '/second', 'Second', session.id)
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      expect(deriveBrowserSessions(list(session), [first, second], [], [])[0]?.project.title).toBe('First')
      deriveBrowserSessions(list(session), [first, second], [], [])
      expect(warning).toHaveBeenCalledTimes(1)
      expect(warning).toHaveBeenCalledWith(expect.stringContaining('belongs to multiple Workspaces'))
    } finally {
      warning.mockRestore()
    }
  })

  it('falls back to a read-only directory project before no-project', () => {
    expect(resolveProjectContext(summary('s1', 1, { cwd: '/tmp/project' }), []).title).toBe('project')
    expect(resolveProjectContext(summary('s2', 1), []).title).toBe('无项目')
  })
})

describe('session attention', () => {
  it('uses waiting, failed, running, completed, idle precedence', () => {
    expect(deriveSessionAttention(summary('s1', 1, { pendingInteraction: 'approval', running: true }), [job('failed')])).toBe('waiting')
    expect(deriveSessionAttention(summary('s2', 1, { running: true }), [job('failed')])).toBe('failed')
    expect(deriveSessionAttention(summary('s3', 1, { completed: true }), [job('running')])).toBe('running')
    expect(deriveSessionAttention(summary('s4', 1, { completed: true }), [])).toBe('completed')
    expect(deriveSessionAttention(summary('s5', 1), [])).toBe('idle')
  })
})

describe('sessionGroupKindLabel', () => {
  it('labels ordinary and topic groups without adding a redundant private badge', () => {
    expect(sessionGroupKindLabel('group')).toBe('群聊')
    expect(sessionGroupKindLabel('group_chat')).toBe('群聊')
    expect(sessionGroupKindLabel('topic')).toBe('话题群')
    expect(sessionGroupKindLabel('private')).toBeUndefined()
  })

  it('does not expose unknown provider-defined categories', () => {
    expect(sessionGroupKindLabel('channel')).toBeUndefined()
    expect(sessionGroupKindLabel(undefined)).toBeUndefined()
  })
})
