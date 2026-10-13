import { describe, it, expect } from 'vitest'

import { toSubscriptionListParams } from './events.api'

const paramsOf = (...args: Parameters<typeof toSubscriptionListParams>) =>
  toSubscriptionListParams(...args).toString()

describe('toSubscriptionListParams', () => {
  it('sends nothing when no filter or page is set', () => {
    expect(paramsOf()).toBe('')
  })

  it('joins several selected teams into one parameter', () => {
    // Appending `teamKeys` once per team is what the API silently dropped,
    // showing every team whenever two or more were selected.
    const params = toSubscriptionListParams({ teamKeys: ['liturgia', 'cozinha'] })

    expect(params.getAll('teamKeys')).toEqual(['liturgia,cozinha'])
  })

  it('joins the selected skills into one parameter', () => {
    const params = toSubscriptionListParams({
      skills: ['has_singing_skills', 'has_guitar_skills'],
    })

    expect(params.get('skills')).toBe('has_singing_skills,has_guitar_skills')
  })

  it('joins the selected experience types into one parameter', () => {
    const params = toSubscriptionListParams({ experience: ['newbie', 'experienced'] })

    expect(params.get('experience')).toBe('newbie,experienced')
  })

  it('omits a cleared multi-select rather than sending an empty parameter', () => {
    expect(paramsOf({ skills: [], experience: [], teamKeys: [], status: [] })).toBe('')
  })

  it('omits an empty search term', () => {
    expect(paramsOf({ name: '' })).toBe('')
  })

  it('carries every filter and the pagination together', () => {
    const params = toSubscriptionListParams(
      {
        name: 'maria',
        teamKeys: ['liturgia'],
        status: ['pending'],
        skills: ['has_cooking_skills'],
        experience: ['newbie'],
      },
      { page: 2, pageSize: 20 }
    )

    expect(Object.fromEntries(params)).toEqual({
      name: 'maria',
      teamKeys: 'liturgia',
      status: 'pending',
      skills: 'has_cooking_skills',
      experience: 'newbie',
      page: '2',
      pageSize: '20',
    })
  })

  it('sends page 1 explicitly, since a page is never implied', () => {
    expect(paramsOf({}, { page: 1 })).toBe('page=1')
  })
})
