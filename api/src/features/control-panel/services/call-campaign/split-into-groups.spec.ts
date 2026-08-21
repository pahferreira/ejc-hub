import { describe, it, expect } from 'vitest'

import { splitIntoGroups } from './split-into-groups.ts'

describe('splitIntoGroups', () => {
  it('conserves the total number of items across groups', () => {
    const items = Array.from({ length: 17 }, (_, index) => index)

    const groups = splitIntoGroups(items, 5)

    expect(groups.flat()).toHaveLength(items.length)
    expect(groups.flat()).toEqual(items)
  })

  it('never produces groups whose sizes differ by more than 1', () => {
    const items = Array.from({ length: 23 }, (_, index) => index)

    const groups = splitIntoGroups(items, 7)
    const sizes = groups.map((group) => group.length)

    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1)
  })

  it('always returns exactly groupCount groups', () => {
    const items = Array.from({ length: 10 }, (_, index) => index)

    expect(splitIntoGroups(items, 4)).toHaveLength(4)
  })

  it('puts the extra items in the LAST groups, never the early ones', () => {
    const items = Array.from({ length: 7 }, (_, index) => index)

    const groups = splitIntoGroups(items, 3)

    // 7 / 3 = base 2, remainder 1 -> sizes [2, 2, 3]
    expect(groups.map((group) => group.length)).toEqual([2, 2, 3])
  })

  it('returns leading EMPTY groups when groupCount exceeds items.length', () => {
    const items = [1, 2, 3]

    const groups = splitIntoGroups(items, 5)

    expect(groups).toHaveLength(5)
    expect(groups.map((group) => group.length)).toEqual([0, 0, 1, 1, 1])
    expect(groups.flat()).toEqual(items)
  })

  it('returns groupCount empty groups when items is empty', () => {
    const groups = splitIntoGroups([], 4)

    expect(groups).toHaveLength(4)
    expect(groups.every((group) => group.length === 0)).toBe(true)
  })

  it('returns an empty array when groupCount is zero or negative', () => {
    expect(splitIntoGroups([1, 2, 3], 0)).toEqual([])
    expect(splitIntoGroups([1, 2, 3], -1)).toEqual([])
  })
})
