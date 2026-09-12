/** Pure browser projections: project context and provider source stay independent. */
import type { SessionListState, SessionSummary } from '@deepseek-ai/dsh-api-session-controller/client';
import type { SessionJob as JobView } from '@deepseek-ai/dsh-api-session-controller/types';
import type { SessionId } from '@deepseek-ai/dsh-session/types';
import type { WorkspaceId, WorkspaceView } from '@deepseek-ai/dsh-api-workspace-controller/client';
import type { SessionPendingInteractionSnapshot } from '@deepseek-ai/dsh-client-ui-session/client';
import type { SessionGroupAssignment } from '../types.js';
export type BrowseMode = 'project' | 'source';
export type SessionAttention = 'waiting' | 'failed' | 'running' | 'completed' | 'idle';
export interface ProjectContext {
    readonly key: string;
    readonly kind: 'workspace' | 'directory' | 'none';
    readonly title: string;
    readonly path?: string;
    readonly workspaceId?: WorkspaceId;
}
export interface SourceContext {
    readonly familyKey: string;
    readonly familyTitle: string;
    readonly iconSource?: string;
    readonly chatKey: string;
    readonly rawSource?: string;
    readonly chatId?: string;
    readonly chatTitle?: string;
    readonly kind?: string;
}
export interface BrowserSession {
    readonly summary: SessionSummary;
    readonly pendingInteraction?: string;
    readonly agentPreset?: string;
    readonly project: ProjectContext;
    readonly source: SourceContext;
    /** Live work is independent from the row's highest-priority attention state. */
    readonly running: boolean;
    /** Runtime-owned completion reminder; opening the Session clears it. */
    readonly unread: boolean;
    readonly attention: SessionAttention;
    readonly jobs: readonly JobView[];
    readonly archived: boolean;
}
export interface StatusCounts {
    readonly waiting: number;
    readonly failed: number;
    readonly running: number;
    readonly completed: number;
    readonly idle: number;
    /** Exact unread total, independent from the highest-priority attention bucket. */
    readonly unread: number;
}
export type BrowserGroupType = 'project' | 'source' | 'chat' | 'activity';
/** One rendered sidebar level. Source mode uses source groups containing chat children. */
export interface BrowserGroup {
    readonly key: string;
    readonly type: BrowserGroupType;
    readonly title: string;
    readonly source?: string;
    readonly providerKind?: string;
    readonly workspaceId?: WorkspaceId;
    readonly path?: string;
    readonly sessions: readonly BrowserSession[];
    readonly children?: readonly BrowserGroup[];
    readonly counts: StatusCounts;
}
/** Human-facing badges for group-like provider categories. Private titles stay provider-owned. */
export declare function sessionGroupKindLabel(kind: string | undefined): string | undefined;
export declare function newestFirst(left: BrowserSession, right: BrowserSession): number;
/** Portable normalization used only for browser grouping keys and boundary-safe comparisons. */
export declare function normalizePathForGrouping(path: string): string;
/** True for the same path or a descendant, never for a shared string prefix such as bar/bar2. */
export declare function isPathWithin(path: string, parent: string): boolean;
/** Resolve explicit Workspace accounting first, then the most specific path, then a read-only cwd group. */
export declare function resolveProjectContext(session: SessionSummary, workspaces: readonly WorkspaceView[], explicitWorkspace?: WorkspaceView): ProjectContext;
export declare function isSessionRunning(session: SessionSummary, jobs: readonly JobView[]): boolean;
export declare function deriveSessionAttention(session: SessionSummary, jobs: readonly JobView[], pendingInteraction?: string): SessionAttention;
/** Derive all root-session rows once; every view is a non-mutating projection over these entries. */
export declare function deriveBrowserSessions(list: SessionListState, workspaces: readonly WorkspaceView[], archivedSessionIds: readonly SessionId[], assignments: readonly SessionGroupAssignment[], pendingInteractions?: SessionPendingInteractionSnapshot): BrowserSession[];
export declare function countStatuses(sessions: readonly BrowserSession[]): StatusCounts;
export declare function groupBrowserSessions(entries: readonly BrowserSession[], workspaces: readonly WorkspaceView[], mode: BrowseMode): BrowserGroup[];
/** Build either project-first or source-first groups without changing either underlying identity. */
export declare function deriveBrowserGroups(list: SessionListState, workspaces: readonly WorkspaceView[], archivedSessionIds: readonly SessionId[], assignments: readonly SessionGroupAssignment[], mode?: BrowseMode, includeArchived?: boolean): BrowserGroup[];
