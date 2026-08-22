/** Remote-backed observable supplying virtual assignments to one sidebar registrant. */
import type { HostObservable } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionGroupSnapshot } from '../types.js'

/** Callable face published after the Typert Remote contribution is mounted. */
export interface SessionGroupsRemoteFace {
  list: () => Promise<
    | { ok: true; value: SessionGroupSnapshot }
    | { ok: false; error: { message: string } }
  >
}

/** Browser fetch state; a failed refresh retains the last successful snapshot. */
export interface SessionGroupsClientSnapshot extends SessionGroupSnapshot {
  readonly loading: boolean
  readonly error?: string
}

const EMPTY: SessionGroupsClientSnapshot = Object.freeze({ assignments: Object.freeze([]), loading: true })

/** Owns Remote refresh deduplication and publishes stable snapshots. */
export class SessionGroupsController {
  private snapshot: SessionGroupsClientSnapshot = EMPTY
  private readonly listeners = new Set<() => void>()
  private inflight?: Promise<void>

  readonly source: HostObservable<SessionGroupsClientSnapshot> = {
    getSnapshot: () => this.snapshot,
    subscribe: listener => {
      this.listeners.add(listener)
      return () => { this.listeners.delete(listener) }
    },
  }

  constructor(private readonly remote: SessionGroupsRemoteFace) {}

  /** Pull one complete Host snapshot, coalescing overlapping renders and timers. */
  refresh(): Promise<void> {
    this.inflight ??= this.pull().finally(() => { this.inflight = undefined })
    return this.inflight
  }

  private async pull(): Promise<void> {
    try {
      const result = await this.remote.list()
      if (!result.ok) throw new Error(result.error.message)
      this.publish(Object.freeze({
        assignments: Object.freeze([...result.value.assignments]),
        loading: false,
      }))
    } catch (error) {
      this.publish(Object.freeze({
        assignments: this.snapshot.assignments,
        loading: false,
        error: error instanceof Error ? error.message : String(error),
      }))
    }
  }

  private publish(next: SessionGroupsClientSnapshot): void {
    this.snapshot = next
    for (const listener of this.listeners) listener()
  }
}
