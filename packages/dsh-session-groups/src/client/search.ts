export interface ContentSearchResult<T> {
  readonly items: readonly T[]
  readonly hasMore: boolean
}

/** Owns cancellation and generation checks so superseded content-search results can never win a race. */
export class ContentSearchCoordinator<T> {
  private generation = 0
  private active?: AbortController

  cancel(): void {
    this.generation += 1
    this.active?.abort()
    this.active = undefined
  }

  async run(
    query: string,
    request: (query: string, signal: AbortSignal) => Promise<ContentSearchResult<T>>,
  ): Promise<ContentSearchResult<T> | undefined> {
    this.cancel()
    const generation = this.generation
    const controller = new AbortController()
    this.active = controller
    try {
      const result = await request(query, controller.signal)
      return generation === this.generation && !controller.signal.aborted ? result : undefined
    } catch (error) {
      if (generation !== this.generation || controller.signal.aborted) return undefined
      throw error
    } finally {
      if (generation === this.generation) this.active = undefined
    }
  }
}
