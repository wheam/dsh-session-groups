import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { WorkspaceId } from '@deepseek-ai/dsh-api-workspace-controller/client'
import type { SessionGroupsBrowserInjected } from '../src/client/browser.js'

vi.mock('dsh-session-groups/remote', () => ({ default: {} }))
vi.mock('../src/client/browser.js', () => ({ SessionGroupsBrowser: () => null }))
vi.mock('../src/client/styles.js', () => ({ installStyles: () => {} }))

import { apply } from '../src/client/index.js'

afterEach(() => { vi.unstubAllGlobals() })

async function mount() {
  vi.stubGlobal('window', { setInterval: () => 1, clearInterval: vi.fn() })
  let injected!: SessionGroupsBrowserInjected
  const uiWorkspace = {
    openSession: vi.fn(), startSession: vi.fn(),
    forkSession: vi.fn().mockResolvedValue(undefined),
    archiveSession: vi.fn().mockResolvedValue(undefined),
    pickDirectory: vi.fn().mockResolvedValue(null),
  }
  const workspaces = { create: vi.fn().mockResolvedValue({}) }
  const openWorkspacePath = vi.fn().mockResolvedValue({ ok: true, value: { opened: true } })
  const ctx = {
    uiWorkspace, workspaces,
    // The 0.1.5 Controller has no legacy Workspace UI/navigation helpers.
    sessions: {},
    remote: { $mount: async () => async () => {}, session: { openWorkspacePath } },
    reflect: { get: () => ({ list: async () => ({ ok: true, value: { assignments: [] } }) }) },
    effect: vi.fn(),
    slots: {
      inject: (_name: string, register: () => void) => register(),
      register: (options: { inject: () => SessionGroupsBrowserInjected }) => { injected = options.inject() },
    },
  }
  const dispose = await apply(ctx as unknown as Context)
  return { injected, uiWorkspace, workspaces, openWorkspacePath, dispose }
}

describe('DSH 0.1.5 client integration', () => {
  it('uses UI navigation to open, start, fork, and archive sessions', async () => {
    const { injected, uiWorkspace, dispose } = await mount()
    const sessionId = 'session-1' as SessionId
    const workspaceId = 'workspace-1' as WorkspaceId
    injected.open(sessionId)
    injected.startSession(workspaceId)
    await injected.forkSession(sessionId)
    await injected.archiveSession(sessionId)
    expect(uiWorkspace.openSession).toHaveBeenCalledWith(sessionId)
    expect(uiWorkspace.startSession).toHaveBeenCalledWith(workspaceId)
    expect(uiWorkspace.forkSession).toHaveBeenCalledWith(sessionId)
    expect(uiWorkspace.archiveSession).toHaveBeenCalledWith(sessionId)
    await dispose()
  })

  it('only registers a workspace after the UI picker returns a path', async () => {
    const { injected, uiWorkspace, workspaces, dispose } = await mount()
    await injected.addWorkspace()
    expect(workspaces.create).not.toHaveBeenCalled()
    uiWorkspace.pickDirectory.mockResolvedValue('/tmp/project')
    await injected.addWorkspace()
    expect(workspaces.create).toHaveBeenCalledWith({ path: '/tmp/project' })
    await dispose()
  })

  it('uses the current path-opening Remote and propagates host failures', async () => {
    const { injected, openWorkspacePath, dispose } = await mount()
    await injected.openPath('/tmp/project')
    expect(openWorkspacePath).toHaveBeenCalledWith({ path: '/tmp/project' })
    openWorkspacePath.mockResolvedValue({ ok: false, error: { message: 'desktop unavailable' } })
    await expect(injected.openPath('/tmp/project')).rejects.toThrow('desktop unavailable')
    await dispose()
  })
})
