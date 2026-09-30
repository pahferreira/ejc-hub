import { describe, it, expect } from 'vitest'
import { comparePeopleByNickname, type SortablePerson } from './compare-people-by-nickname.ts'

function person(
  overrides: Partial<SortablePerson> & Pick<SortablePerson, 'userId'>
): SortablePerson {
  return {
    name: 'Maria Silva',
    nickname: 'Mari',
    ...overrides,
  }
}

function sortedIds(people: SortablePerson[]): string[] {
  return [...people].sort(comparePeopleByNickname).map((row) => row.userId)
}

describe('comparePeopleByNickname', () => {
  it('orders by nickname', () => {
    const people = [
      person({ userId: 'u1', nickname: 'Carla' }),
      person({ userId: 'u2', nickname: 'Ana' }),
      person({ userId: 'u3', nickname: 'Bruno' }),
    ]

    expect(sortedIds(people)).toEqual(['u2', 'u3', 'u1'])
  })

  it('ignores accents, so "Jú" sits with "Ju" rather than after every plain letter', () => {
    const people = [
      person({ userId: 'u1', nickname: 'Lia' }),
      person({ userId: 'u2', nickname: 'Jú' }),
      person({ userId: 'u3', nickname: 'Ana' }),
    ]

    expect(sortedIds(people)).toEqual(['u3', 'u2', 'u1'])
  })

  it('ignores case, so a lowercase nickname is not exiled to the end', () => {
    const people = [
      person({ userId: 'u1', nickname: 'bruno' }),
      person({ userId: 'u2', nickname: 'Ana' }),
      person({ userId: 'u3', nickname: 'Carla' }),
    ]

    expect(sortedIds(people)).toEqual(['u2', 'u1', 'u3'])
  })

  it('breaks a shared nickname by full name', () => {
    const people = [
      person({ userId: 'u1', nickname: 'Ju', name: 'Juliana Alves' }),
      person({ userId: 'u2', nickname: 'Ju', name: 'Julia Barros' }),
      person({ userId: 'u3', nickname: 'Ju', name: 'Juçara Costa' }),
    ]

    expect(sortedIds(people)).toEqual(['u3', 'u2', 'u1'])
  })

  it('breaks a shared nickname and name by id, so paging cannot repeat or drop a row', () => {
    const people = [
      person({ userId: 'u2', nickname: 'Ju', name: 'Julia Barros' }),
      person({ userId: 'u1', nickname: 'Ju', name: 'Julia Barros' }),
    ]

    expect(sortedIds(people)).toEqual(['u1', 'u2'])
  })

  it('treats nicknames differing only in accent or case as equal before the tiebreaks', () => {
    const first = person({ userId: 'u1', nickname: 'Ju', name: 'Ana Lima' })
    const second = person({ userId: 'u2', nickname: 'JÚ', name: 'Ana Lima' })

    expect(comparePeopleByNickname(first, second)).toBe('u1'.localeCompare('u2'))
  })

  it('is stable regardless of the input order', () => {
    const people = [
      person({ userId: 'u1', nickname: 'Carla' }),
      person({ userId: 'u2', nickname: 'Ana' }),
      person({ userId: 'u3', nickname: 'Bruno' }),
    ]

    expect(sortedIds(people)).toEqual(sortedIds([...people].reverse()))
  })
})
