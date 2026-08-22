/** Pure browser grouping: virtual assignments take precedence over real Workspace accounting. */
import type { SessionId, SessionListState, SessionSummary, WorkspaceId, WorkspaceView } from '@deepseek-ai/dsh-client-runtime/client';
import type { SessionGroupAssignment } from '../types.js';
/** One rendered sidebar group. */
export interface BrowserGroup {
    readonly key: string;
    readonly title: string;
    readonly source?: string;
    readonly kind?: string;
    readonly workspaceId?: WorkspaceId;
    readonly sessions: readonly SessionSummary[];
}
/**
 * Build native Workspace, provider-defined virtual, and final ungrouped rows.
 * A virtual assignment wins even if the Session is also accounted by a real Workspace.
 */
export declare function deriveBrowserGroups(list: SessionListState, workspaces: readonly WorkspaceView[], archivedSessionIds: readonly SessionId[], assignments: readonly SessionGroupAssignment[]): BrowserGroup[];
