import { describe, expect, it, vi } from 'vitest'
import type { SessionId } from '@deepseek-ai/dsh-client-runtime/client'
import type { SessionGroupId } from '../src/types.js'
import { SessionGroupsController } from '../src/client/controller.js'

describe('SessionGroupsController', () => {
  it('pulls through the mounted Remote face supplied by the caller', async () => {
    const list = vi.fn(async () => ({
      ok: true as const,
      value: {
        assignments: [{
          sessionId: 'session-1' as SessionId,
          group: {
            id: 'group-1' as SessionGroupId,
            title: '飞书群',
            source: 'feishu',
          },
          updatedAt: 1,
        }],
      },
    }))
    const controller = new SessionGroupsController({ list })

    await controller.refresh()

    expect(list).toHaveBeenCalledOnce()
    expect(controller.source.getSnapshot()).toMatchObject({
      loading: false,
      assignments: [{ sessionId: 'session-1' }],
    })
  })
})
