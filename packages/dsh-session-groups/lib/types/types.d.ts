/** Public JSON vocabulary shared by group providers, the Host Remote, and the browser. */
import type { Branded } from '@deepseek-ai/dsh-brand';
import type { SessionId } from '@deepseek-ai/dsh-session/types';
/** Stable provider-owned identity of one communication source/chat (legacy API name retained). */
export type SessionGroupId = Branded<'SessionGroupId'>;
/** Provider-supplied presentation and identity for a communication source/chat. */
export interface SessionGroupDescriptor {
    /** Stable opaque chat id; combine it with exact `source` when storing externally. */
    readonly id: SessionGroupId;
    /** Human-facing chat label. */
    readonly title: string;
    /** Provider namespace such as `feishu`, `slack`, or `telegram`. */
    readonly source: string;
    /** Optional provider-defined chat category such as `private`, `group`, or `topic`. */
    readonly kind?: string;
}
/** Durable communication-origin descriptor attached to one DSH Session. */
export interface SessionGroupAssignment {
    readonly sessionId: SessionId;
    readonly group: SessionGroupDescriptor;
    /** Host commit time in Unix epoch milliseconds. */
    readonly updatedAt: number;
}
/** Complete current communication-origin assignment snapshot. */
export interface SessionGroupSnapshot {
    readonly assignments: readonly SessionGroupAssignment[];
}
/** Stored source value keyed by Session id in the sidecar domain. */
export interface SessionGroupRecord {
    readonly group: SessionGroupDescriptor;
    readonly updatedAt: number;
}
