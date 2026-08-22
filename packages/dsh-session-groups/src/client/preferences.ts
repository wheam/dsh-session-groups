import type { BrowseMode, SessionAttention } from './groups.js'

export type SortMode = 'manual' | 'recent' | 'name' | 'status'
export type UpdatedRange = 'any' | 'day' | 'week' | 'month'
export type AttentionFilter = 'all' | Exclude<SessionAttention, 'idle'>

export interface BrowserPreferences {
  readonly version: 1
  readonly browseMode: BrowseMode
  readonly sortMode: SortMode
  readonly attentionFilter: AttentionFilter
  readonly sourceFilter: string
  readonly chatFilter: string
  readonly updatedRange: UpdatedRange
  readonly collapsed: Readonly<Record<BrowseMode, readonly string[]>>
  readonly pinnedGroups: Readonly<Record<BrowseMode, readonly string[]>>
  readonly pinnedSessions: readonly string[]
  readonly manualGroups: Readonly<Record<BrowseMode, readonly string[]>>
  readonly manualSessions: Readonly<Record<string, readonly string[]>>
}

export const PREFERENCES_KEY = 'dsh-session-groups/browser-preferences-v1'

export function defaultPreferences(): BrowserPreferences {
  return {
    version: 1,
    browseMode: 'project',
    sortMode: 'manual',
    attentionFilter: 'all',
    sourceFilter: '',
    chatFilter: '',
    updatedRange: 'any',
    collapsed: { project: [], source: [] },
    pinnedGroups: { project: [], source: [] },
    pinnedSessions: [],
    manualGroups: { project: [], source: [] },
    manualSessions: {},
  }
}

function strings(value: unknown, limit = 1_000): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string').slice(0, limit)
}

function recordOfStrings(value: unknown): Record<string, readonly string[]> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return {}
  const result: Record<string, readonly string[]> = {}
  for (const [key, item] of Object.entries(value).slice(0, 1_000)) result[key] = strings(item)
  return result
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? value as T : fallback
}

/** Parse untrusted localStorage data field-by-field so corrupt preferences never block navigation. */
export function parsePreferences(value: unknown): BrowserPreferences {
  const defaults = defaultPreferences()
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return defaults
  const input = value as Record<string, unknown>
  const collapsed = input.collapsed as Record<string, unknown> | undefined
  const pinnedGroups = input.pinnedGroups as Record<string, unknown> | undefined
  const manualGroups = input.manualGroups as Record<string, unknown> | undefined
  return {
    version: 1,
    browseMode: oneOf(input.browseMode, ['project', 'source'], defaults.browseMode),
    sortMode: oneOf(input.sortMode, ['manual', 'recent', 'name', 'status'], defaults.sortMode),
    attentionFilter: oneOf(input.attentionFilter, ['all', 'waiting', 'failed', 'running', 'completed'], defaults.attentionFilter),
    sourceFilter: typeof input.sourceFilter === 'string' ? input.sourceFilter : '',
    chatFilter: typeof input.chatFilter === 'string' ? input.chatFilter : '',
    updatedRange: oneOf(input.updatedRange, ['any', 'day', 'week', 'month'], defaults.updatedRange),
    collapsed: {
      project: strings(collapsed?.project),
      source: strings(collapsed?.source),
    },
    pinnedGroups: {
      project: strings(pinnedGroups?.project),
      source: strings(pinnedGroups?.source),
    },
    pinnedSessions: strings(input.pinnedSessions),
    manualGroups: {
      project: strings(manualGroups?.project),
      source: strings(manualGroups?.source),
    },
    manualSessions: recordOfStrings(input.manualSessions),
  }
}

export function loadPreferences(storage: Pick<Storage, 'getItem'>): BrowserPreferences {
  try {
    const serialized = storage.getItem(PREFERENCES_KEY)
    return serialized === null ? defaultPreferences() : parsePreferences(JSON.parse(serialized))
  } catch {
    return defaultPreferences()
  }
}

export function savePreferences(storage: Pick<Storage, 'setItem'>, preferences: BrowserPreferences): void {
  try {
    storage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
  } catch {
    // Browser storage may be unavailable or full. Preferences are non-critical.
  }
}

export function toggleListItem(items: readonly string[], key: string): string[] {
  return items.includes(key) ? items.filter(item => item !== key) : [...items, key]
}

/** DOM insertBefore semantics for persistent manual orders. Missing keys are appended before moving. */
export function moveKeyBefore(items: readonly string[], key: string, before?: string): string[] {
  const next = items.filter(item => item !== key)
  if (before === undefined || before === key) return [...next, key]
  const index = next.indexOf(before)
  if (index < 0) return [...next, key]
  next.splice(index, 0, key)
  return next
}

export function orderByKeys<T>(items: readonly T[], keys: readonly string[], keyOf: (item: T) => string): T[] {
  const rank = new Map(keys.map((key, index) => [key, index]))
  return items.toSorted((left, right) => {
    const leftRank = rank.get(keyOf(left))
    const rightRank = rank.get(keyOf(right))
    if (leftRank === undefined && rightRank === undefined) return 0
    if (leftRank === undefined) return 1
    if (rightRank === undefined) return -1
    return leftRank - rightRank
  })
}
