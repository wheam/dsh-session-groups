import type { PropsRuntime, SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots';
import type { SessionSearchResultItem } from '@deepseek-ai/dsh-api-session-controller/client';
import type { SessionId } from '@deepseek-ai/dsh-session/types';
import type { SubagentAddress } from '@deepseek-ai/dsh-subagent/client';
import type { WorkspaceId } from '@deepseek-ai/dsh-api-workspace-controller/client';
import { type SessionGroupsClientSnapshot } from './controller.js';
/** Business callbacks and the renderer-bound observable hook. */
export interface SessionGroupsBrowserInjected {
    hooks: {
        sessionGroups: import('@deepseek-ai/dsh-client-ui-slots').HostObservable<SessionGroupsClientSnapshot>;
    };
    refresh: () => Promise<void>;
    open: (sessionId: SessionId) => void;
    openSubagent: (address: SubagentAddress) => void;
    refreshSubagents: (sessionId: SessionId) => Promise<void>;
    setSubagentCatalogOpen: (sessionId: SessionId, open: boolean) => void;
    searchContent: (query: string, signal: AbortSignal) => Promise<{
        items: readonly SessionSearchResultItem[];
        hasMore: boolean;
    }>;
    startSession: (workspaceId?: WorkspaceId) => void;
    addWorkspace: () => Promise<void>;
    openPath: (path: string) => Promise<void>;
    renameSession: (sessionId: SessionId, currentTitle: string) => Promise<void>;
    forkSession: (sessionId: SessionId) => Promise<void>;
    archiveSession: (sessionId: SessionId) => Promise<void>;
    renameWorkspace: (workspaceId: WorkspaceId, currentTitle: string) => Promise<void>;
    deleteWorkspace: (workspaceId: WorkspaceId, title: string) => Promise<void>;
    moveWorkspace: (workspaceId: WorkspaceId, beforeWorkspaceId?: WorkspaceId) => Promise<void>;
    moveSession: (workspaceId: WorkspaceId, sessionId: SessionId, beforeSessionId?: SessionId) => Promise<void>;
}
type BrowserProps = PropsRuntime<'sidebar.workspaces'> & Omit<SessionGroupsBrowserInjected, 'hooks'> & {
    useSessionGroups: SnapshotSelectorHook<SessionGroupsClientSnapshot>;
};
/** Render the replacement browsing region. */
export declare function SessionGroupsBrowser({ wide, expandSidebar, useSessions, useSessionPendingInteraction, useWorkspaces, useSessionGroups, refresh, open, openSubagent, refreshSubagents, setSubagentCatalogOpen, searchContent, startSession, addWorkspace, openPath, renameSession, forkSession, archiveSession, renameWorkspace, deleteWorkspace, moveWorkspace, moveSession, }: BrowserProps): import("react").JSX.Element;
export {};
