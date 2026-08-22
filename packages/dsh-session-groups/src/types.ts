/** Public JSON vocabulary shared by group providers, the Host Remote, and the browser. */
import type { Branded } from '@deepseek-ai/dsh-brand'
import type { SessionId } from '@deepseek-ai/dsh-session/types'

/** Stable provider-owned identity of one virtual group. */
export type SessionGroupId = Branded<'SessionGroupId'>

/** Provider-supplied presentation and identity for a virtual session group. */
export interface SessionGroupDescriptor {
  /** Stable opaque group id; combine it with `source` when storing externally. */
  readonly id: SessionGroupId
  /** Human-facing group label. */
  readonly title: string
  /** Provider namespace such as `feishu`, `slack`, or `telegram`. */
  readonly source: string
  /** Optional provider-defined category used only for diagnostics and styling. */
  readonly kind?: string
}

/** Durable descriptor assigned to one DSH Session. */
export interface SessionGroupAssignment {
  readonly sessionId: SessionId
  readonly group: SessionGroupDescriptor
  /** Host commit time in Unix epoch milliseconds. */
  readonly updatedAt: number
}

/** Complete current virtual-group assignment snapshot. */
export interface SessionGroupSnapshot {
  readonly assignments: readonly SessionGroupAssignment[]
}

/** Stored value keyed by Session id in the sidecar domain. */
export interface SessionGroupRecord {
  readonly group: SessionGroupDescriptor
  readonly updatedAt: number
}

