import { describe, it, expect } from 'vitest'

import { listCurrentSubscriptionsQuerystringSchema } from './events.schema.ts'

const parse = (query: Record<string, unknown>) =>
  listCurrentSubscriptionsQuerystringSchema.parse(query)

describe('listCurrentSubscriptionsQuerystringSchema', () => {
  it('splits a comma-joined multi-value filter', () => {
    expect(parse({ skills: 'has_singing_skills,has_guitar_skills' }).skills).toEqual([
      'has_singing_skills',
      'has_guitar_skills',
    ])
  })

  it('reads a single value as a one-item list', () => {
    expect(parse({ teamKeys: 'liturgia' }).teamKeys).toEqual(['liturgia'])
  })

  it('accepts a repeated parameter that arrived already split', () => {
    // The shape `teamKeys=a&teamKeys=b` parses to. The hand-rolled preprocess
    // this replaced returned undefined here, so selecting two teams silently
    // showed every team.
    expect(parse({ teamKeys: ['liturgia', 'cozinha'] }).teamKeys).toEqual(['liturgia', 'cozinha'])
  })

  it('drops a cleared control that sends an empty value', () => {
    expect(parse({ skills: '', experience: '', teamKeys: '' })).toEqual({
      skills: [],
      experience: [],
      teamKeys: [],
    })
  })

  it('drops blank segments from a trailing comma', () => {
    expect(parse({ experience: 'newbie,' }).experience).toEqual(['newbie'])
  })

  it('trims whitespace around segments', () => {
    expect(parse({ teamKeys: 'liturgia , cozinha' }).teamKeys).toEqual(['liturgia', 'cozinha'])
  })

  it('leaves an absent filter undefined', () => {
    expect(parse({})).toEqual({})
  })

  it('rejects an experience type outside the shared vocabulary', () => {
    expect(() => parse({ experience: 'coordinator' })).toThrow()
  })

  it('rejects a status outside the known statuses', () => {
    expect(() => parse({ status: 'approved' })).toThrow()
  })

  it('accepts any skill string, leaving unknown ones to match nothing downstream', () => {
    // The skill vocabulary is shared through common/ rather than restated as a
    // zod enum here, so a stale bookmark is filtered out by the filter itself.
    expect(parse({ skills: 'has_telepathy_skills' }).skills).toEqual(['has_telepathy_skills'])
  })

  it('rejects a blank search term rather than matching everything', () => {
    // Unreachable from the table, which omits the parameter entirely when the
    // box is empty, so rejecting is cheaper than another preprocess.
    expect(() => parse({ name: '   ' })).toThrow()
  })
})
