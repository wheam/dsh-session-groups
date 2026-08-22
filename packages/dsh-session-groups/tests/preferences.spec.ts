import { describe, expect, it } from 'vitest'
import {
  defaultPreferences,
  loadPreferences,
  moveKeyBefore,
  orderByKeys,
  parsePreferences,
  savePreferences,
  toggleListItem,
} from '../src/client/preferences.js'

describe('browser preferences', () => {
  it('falls back safely when persisted data is corrupt', () => {
    expect(loadPreferences({ getItem: () => '{bad json' })).toEqual(defaultPreferences())
    expect(parsePreferences({ browseMode: 'bad', collapsed: { project: [1, 'ok'] } })).toMatchObject({
      browseMode: 'project',
      collapsed: { project: ['ok'], source: [] },
    })
  })

  it('silently degrades when storage rejects reads or writes', () => {
    expect(loadPreferences({ getItem: () => { throw new Error('denied') } })).toEqual(defaultPreferences())
    expect(() => { savePreferences({ setItem: () => { throw new Error('full') } }, defaultPreferences()) }).not.toThrow()
  })

  it('toggles and reorders keys with insert-before semantics', () => {
    expect(toggleListItem(['a'], 'a')).toEqual([])
    expect(toggleListItem(['a'], 'b')).toEqual(['a', 'b'])
    expect(moveKeyBefore(['a', 'b', 'c'], 'c', 'a')).toEqual(['c', 'a', 'b'])
    expect(moveKeyBefore(['a', 'b', 'c'], 'a')).toEqual(['b', 'c', 'a'])
  })

  it('orders known keys while preserving unlisted input order', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    expect(orderByKeys(items, ['c', 'a'], item => item.id).map(item => item.id)).toEqual(['c', 'a', 'b'])
  })
})
