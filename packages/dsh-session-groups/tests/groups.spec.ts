import { describe, expect, it } from 'vitest'
import type {
  SessionId,
  SessionListState,
  SessionSummary,
  WorkspaceId,
  WorkspaceView,
} from '@deepseek-ai/dsh-client-runtime/client'
import type { SessionGroupAssignment, SessionGroupId } from '../src/types.js'
import { deriveBrowserGroups } from '../src/client/groups.js'

const sid = (value: string) => value as SessionId
const wid = (value: string) => value as WorkspaceId
const gid = (value: string) => value as SessionGroupId

function summary(id: string, updatedAt: number): SessionSummary {
  return {
    id: sid(id),
    displayTitle: id,
    running: false,
    blank: false,
    updatedAt,
  }
}

function list(...sessions: SessionSummary[]): SessionListState {
  return {
    ids: sessions.map(item => item.id),
    byId: Object.fromEntries(sessions.map(item => [item.id, item])) as SessionListState['byId'],
    current: undefined,
    phase: 'ready',
    subagentsByParent: {},
    jobsBySession: {},
    currentAddress: undefined,
  }
}

function workspace(...sessionIds: SessionId[]): WorkspaceView {
  return {
    workspaceId: wid('workspace-1'),
    path: '/tmp/project',
    title: 'Project',
    sessionIds,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

function assignment(sessionId: string, groupId: string, title: string, updatedAt = 1): SessionGroupAssignment {
  return {
    sessionId: sid(sessionId),
    group: { id: gid(groupId), title, source: 'feishu', kind: 'topic' },
    updatedAt,
  }
}

describe('deriveBrowserGroups', () => {
  it('moves assigned sessions out of native and ungrouped buckets', () => {
    const first = summary('s1', 10)
    const second = summary('s2', 20)
    const groups = deriveBrowserGroups(
      list(first, second),
      [workspace(first.id)],
      [],
      [assignment('s1', 'chat-a', '飞书群 A'), assignment('s2', 'chat-a', '飞书群 A')],
    )
    expect(groups.map(group => [group.title, group.sessions.map(item => item.id)])).toEqual([
      ['Project', []],
      ['飞书群 A', ['s2', 's1']],
    ])
  })

  it('uses the newest descriptor title for one stable provider group', () => {
    const groups = deriveBrowserGroups(
      list(summary('s1', 1), summary('s2', 2)),
      [],
      [],
      [assignment('s1', 'chat-a', '旧群名', 1), assignment('s2', 'chat-a', '新群名', 2)],
    )
    expect(groups).toHaveLength(1)
    expect(groups[0]?.title).toBe('新群名')
  })

  it('keeps unrelated sessions in the final ungrouped bucket', () => {
    const groups = deriveBrowserGroups(list(summary('loose', 1)), [], [], [])
    expect(groups.map(group => group.title)).toEqual(['未分组'])
  })
})
