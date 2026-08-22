/** Generic durable virtual-group service and Host Remote for DSH Sessions. */
import { Context, Service } from '@deepseek-ai/cordis'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { KvTable } from '@deepseek-ai/dsh-storage-domain'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { sessionGroupDescriptorSchema, sessionGroupsDomainSpec } from './spec.js'
import type {
  SessionGroupAssignment,
  SessionGroupDescriptor,
  SessionGroupRecord,
  SessionGroupSnapshot,
} from './types.js'

export type * from './types.js'
export { sessionGroupDescriptorSchema, sessionGroupRecordSchema, sessionGroupsDomainSpec } from './spec.js'

declare module '@deepseek-ai/cordis' {
  interface Context {
    sessionGroups: SessionGroupsService
  }
}

function sameDescriptor(left: SessionGroupDescriptor, right: SessionGroupDescriptor): boolean {
  return left.id === right.id
    && left.title === right.title
    && left.source === right.source
    && left.kind === right.kind
}

function snapshotDescriptor(group: SessionGroupDescriptor): SessionGroupDescriptor {
  return Object.freeze({
    id: group.id,
    title: group.title,
    source: group.source,
    ...(group.kind === undefined ? {} : { kind: group.kind }),
  })
}

/** Host sidecar service consumed by channel/provider plugins and the browser Remote. */
export class SessionGroupsService extends TypertRemoteService {
  static inject = ['storageDomain']

  private table?: KvTable<SessionId, SessionGroupRecord>

  /** Create the Cordis service under `ctx.sessionGroups`. */
  constructor(ctx: Context) {
    super(ctx, 'sessionGroups')
  }

  /** Open and own the sidecar storage domain. */
  protected async [Service.init](): Promise<void> {
    const domain = await this.ctx.storageDomain.open(sessionGroupsDomainSpec)
    this.ctx.effect(() => async () => { await domain.close() }, 'session-groups.domainClose')
    this.table = domain.table('sessions')
  }

  /**
   * Assign one Session to a provider-owned virtual group. Identical assignments
   * are no-ops; a changed title replaces the whole descriptor durably.
   */
  async assign(sessionId: SessionId, descriptor: SessionGroupDescriptor): Promise<void> {
    const group = snapshotDescriptor(sessionGroupDescriptorSchema.parse(descriptor))
    const table = this.requireTable()
    const current = table.get(sessionId)
    if (current !== undefined && sameDescriptor(current.group, group)) return
    await table.put(sessionId, Object.freeze({ group, updatedAt: Date.now() }))
  }

  /** Remove one Session's virtual assignment; absence is already successful. */
  async unassign(sessionId: SessionId): Promise<void> {
    await this.requireTable().delete(sessionId)
  }

  /** Return the complete immutable assignment snapshot for the browser. */
  @Remote('list')
  list(): SessionGroupSnapshot {
    const assignments: SessionGroupAssignment[] = [...this.requireTable().entries()]
      .map(([sessionId, record]) => Object.freeze({
        sessionId,
        group: snapshotDescriptor(record.group),
        updatedAt: record.updatedAt,
      }))
      .sort((left, right) => left.sessionId === right.sessionId ? 0 : left.sessionId < right.sessionId ? -1 : 1)
    return Object.freeze({ assignments: Object.freeze(assignments) })
  }

  private requireTable(): KvTable<SessionId, SessionGroupRecord> {
    if (this.table === undefined) throw new Error('dsh-session-groups is not initialized')
    return this.table
  }
}

export default SessionGroupsService
