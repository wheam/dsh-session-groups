/** Remote-backed observable supplying virtual assignments to one sidebar registrant. */
import type { HostObservable } from '@deepseek-ai/dsh-client-ui-slots';
import type { SessionGroupSnapshot } from '../types.js';
/** Callable face published after the Typert Remote contribution is mounted. */
export interface SessionGroupsRemoteFace {
    list: () => Promise<{
        ok: true;
        value: SessionGroupSnapshot;
    } | {
        ok: false;
        error: {
            message: string;
        };
    }>;
}
/** Browser fetch state; a failed refresh retains the last successful snapshot. */
export interface SessionGroupsClientSnapshot extends SessionGroupSnapshot {
    readonly loading: boolean;
    readonly error?: string;
}
/** Keep the compact sidebar warning honest about which layer failed. */
export declare function sessionGroupsErrorMessage(error: string): string;
/** Owns Remote refresh deduplication and publishes stable snapshots. */
export declare class SessionGroupsController {
    private readonly remote;
    private snapshot;
    private readonly listeners;
    private inflight?;
    readonly source: HostObservable<SessionGroupsClientSnapshot>;
    constructor(remote: SessionGroupsRemoteFace);
    /** Pull one complete Host snapshot, coalescing overlapping renders and timers. */
    refresh(): Promise<void>;
    private pull;
    private publish;
}
