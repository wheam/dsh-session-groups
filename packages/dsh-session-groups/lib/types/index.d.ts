/** Durable provider-origin service and Host Remote for DSH Sessions. */
import { Context, Service } from '@deepseek-ai/cordis';
import type { SessionId } from '@deepseek-ai/dsh-session/types';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { SessionGroupDescriptor, SessionGroupSnapshot } from './types.js';
export type * from './types.js';
export { sessionGroupDescriptorSchema, sessionGroupRecordSchema, sessionGroupsDomainSpec } from './spec.js';
declare module '@deepseek-ai/cordis' {
    interface Context {
        sessionGroups: SessionGroupsService;
    }
}
/** Host sidecar service consumed by channel/provider plugins and the browser Remote. */
export declare class SessionGroupsService extends TypertRemoteService {
    static inject: string[];
    private table?;
    /** Create the Cordis service under `ctx.sessionGroups`. */
    constructor(ctx: Context);
    /** Open and own the sidecar storage domain. */
    protected [Service.init](): Promise<void>;
    /**
     * Attach one provider-owned communication origin to a Session. The legacy
     * sessionGroups name stays compatible and does not replace Workspace membership.
     * Identical assignments are no-ops; a changed title replaces the descriptor durably.
     */
    assign(sessionId: SessionId, descriptor: SessionGroupDescriptor): Promise<void>;
    /** Remove one Session's communication-origin assignment; absence is already successful. */
    unassign(sessionId: SessionId): Promise<void>;
    /** Return the complete immutable source-assignment snapshot for the browser. */
    list(): SessionGroupSnapshot;
    private requireTable;
}
export default SessionGroupsService;
//# sourceMappingURL=index.d.ts.map