import { describe, expect, it } from 'vitest'
import { ContentSearchCoordinator } from '../src/client/search.js'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe('ContentSearchCoordinator', () => {
  it('aborts and suppresses a superseded result', async () => {
    const coordinator = new ContentSearchCoordinator<string>()
    const first = deferred<{ items: readonly string[], hasMore: boolean }>()
    const second = deferred<{ items: readonly string[], hasMore: boolean }>()
    const signals: AbortSignal[] = []
    const request = (query: string, signal: AbortSignal) => {
      signals.push(signal)
      return query === 'first' ? first.promise : second.promise
    }

    const firstRun = coordinator.run('first', request)
    const secondRun = coordinator.run('second', request)
    expect(signals[0]?.aborted).toBe(true)
    first.resolve({ items: ['stale'], hasMore: false })
    second.resolve({ items: ['fresh'], hasMore: true })

    expect(await firstRun).toBeUndefined()
    expect(await secondRun).toEqual({ items: ['fresh'], hasMore: true })
  })

  it('suppresses abort-driven failures but preserves current failures', async () => {
    const coordinator = new ContentSearchCoordinator<string>()
    const stale = deferred<{ items: readonly string[], hasMore: boolean }>()
    const staleRun = coordinator.run('stale', () => stale.promise)
    coordinator.cancel()
    stale.reject(new Error('aborted transport'))
    expect(await staleRun).toBeUndefined()

    await expect(coordinator.run('current', async () => { throw new Error('network') })).rejects.toThrow('network')
  })
})
