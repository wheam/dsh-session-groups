import { afterEach, describe, expect, it, vi } from 'vitest'
import { installStyles, styles } from '../src/client/styles.js'

describe('session group styles', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps overlapping fiber styles independently owned', () => {
    const appended: Array<{
      dataset: Record<string, string>
      textContent: string
      remove: ReturnType<typeof vi.fn>
    }> = []
    vi.stubGlobal('document', {
      createElement: () => ({ dataset: {}, textContent: '', remove: vi.fn() }),
      head: { appendChild: (element: typeof appended[number]) => { appended.push(element) } },
    })

    const disposeFirst = installStyles()
    const disposeSecond = installStyles()

    expect(appended).toHaveLength(2)
    expect(appended[0]?.dataset).toEqual({
      plugin: 'dsh-session-groups',
      pluginCss: 'dsh-session-groups/styles',
    })
    expect(appended[0]?.textContent).toBe(styles)

    disposeFirst()

    expect(appended[0]?.remove).toHaveBeenCalledOnce()
    expect(appended[1]?.remove).not.toHaveBeenCalled()

    disposeSecond()

    expect(appended[1]?.remove).toHaveBeenCalledOnce()
  })
})
