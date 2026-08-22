import type { PropsRuntime, SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots';
import type { SessionId, WorkspaceId } from '@deepseek-ai/dsh-client-runtime/client';
import { type SessionGroupsClientSnapshot } from './controller.js';
/** Business callbacks and the renderer-bound observable hook. */
export interface SessionGroupsBrowserInjected {
    hooks: {
        sessionGroups: import('@deepseek-ai/dsh-client-ui-slots').HostObservable<SessionGroupsClientSnapshot>;
    };
    refresh: () => Promise<void>;
    open: (sessionId: SessionId) => void;
    startSession: (workspaceId?: WorkspaceId) => void;
    addWorkspace: () => Promise<void>;
    renameSession: (sessionId: SessionId, currentTitle: string) => Promise<void>;
    forkSession: (sessionId: SessionId) => Promise<void>;
    archiveSession: (sessionId: SessionId) => Promise<void>;
    renameWorkspace: (workspaceId: WorkspaceId, currentTitle: string) => Promise<void>;
    deleteWorkspace: (workspaceId: WorkspaceId, title: string) => Promise<void>;
}
type BrowserProps = PropsRuntime<'sidebar.workspaces'> & Omit<SessionGroupsBrowserInjected, 'hooks'> & {
    useSessionGroups: SnapshotSelectorHook<SessionGroupsClientSnapshot>;
};
/** Render the replacement browsing region. */
export declare function SessionGroupsBrowser({ wide, expandSidebar, useSessions, useWorkspaces, useSessionGroups, refresh, open, startSession, addWorkspace, renameSession, forkSession, archiveSession, renameWorkspace, deleteWorkspace, }: BrowserProps): import("react").JSX.Element;
export {};
