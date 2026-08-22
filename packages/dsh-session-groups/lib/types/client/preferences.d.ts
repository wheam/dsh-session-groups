import type { BrowseMode, SessionAttention } from './groups.js';
export type SortMode = 'manual' | 'recent' | 'name' | 'status';
export type UpdatedRange = 'any' | 'day' | 'week' | 'month';
export type AttentionFilter = 'all' | Exclude<SessionAttention, 'idle'>;
export interface BrowserPreferences {
    readonly version: 1;
    readonly browseMode: BrowseMode;
    readonly sortMode: SortMode;
    readonly attentionFilter: AttentionFilter;
    readonly sourceFilter: string;
    readonly chatFilter: string;
    readonly updatedRange: UpdatedRange;
    readonly collapsed: Readonly<Record<BrowseMode, readonly string[]>>;
    readonly pinnedGroups: Readonly<Record<BrowseMode, readonly string[]>>;
    readonly pinnedSessions: readonly string[];
    readonly manualGroups: Readonly<Record<BrowseMode, readonly string[]>>;
    readonly manualSessions: Readonly<Record<string, readonly string[]>>;
}
export declare const PREFERENCES_KEY = "dsh-session-groups/browser-preferences-v1";
export declare function defaultPreferences(): BrowserPreferences;
/** Parse untrusted localStorage data field-by-field so corrupt preferences never block navigation. */
export declare function parsePreferences(value: unknown): BrowserPreferences;
export declare function loadPreferences(storage: Pick<Storage, 'getItem'>): BrowserPreferences;
export declare function savePreferences(storage: Pick<Storage, 'setItem'>, preferences: BrowserPreferences): void;
export declare function toggleListItem(items: readonly string[], key: string): string[];
/** DOM insertBefore semantics for persistent manual orders. Missing keys are appended before moving. */
export declare function moveKeyBefore(items: readonly string[], key: string, before?: string): string[];
export declare function orderByKeys<T>(items: readonly T[], keys: readonly string[], keyOf: (item: T) => string): T[];
