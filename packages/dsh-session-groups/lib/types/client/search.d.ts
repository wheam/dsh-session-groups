export interface ContentSearchResult<T> {
    readonly items: readonly T[];
    readonly hasMore: boolean;
}
/** Owns cancellation and generation checks so superseded content-search results can never win a race. */
export declare class ContentSearchCoordinator<T> {
    private generation;
    private active?;
    cancel(): void;
    run(query: string, request: (query: string, signal: AbortSignal) => Promise<ContentSearchResult<T>>): Promise<ContentSearchResult<T> | undefined>;
}
