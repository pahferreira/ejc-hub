import { describe, it, expect } from 'vitest'
import { getHomeView } from './getHomeView'
import type { AssignedTeam } from '../services/events/events.types'

const team: AssignedTeam = {
  id: 'team-1',
  name: 'Liturgia',
  description: null,
  coordinators: [],
}

describe('getHomeView', () => {
  it('returns subscribe when there is no subscription', () => {
    expect(getHomeView(null, null)).toEqual({ kind: 'subscribe', waitingList: false })
  })

  it('returns subscribe even if a stale assignedTeam was provided alongside null status', () => {
    expect(getHomeView(null, team)).toEqual({ kind: 'subscribe', waitingList: false })
  })

  it('returns subscriptionsClosed when there is no subscription and subscriptions are closed', () => {
    expect(getHomeView(null, null, { subscriptionMode: 'closed' })).toEqual({
      kind: 'subscriptionsClosed',
    })
  })

  it('still offers the form in waiting-list mode, flagged so the card can warn about it', () => {
    expect(getHomeView(null, null, { subscriptionMode: 'waiting_list' })).toEqual({
      kind: 'subscribe',
      waitingList: true,
    })
  })

  it('keeps showing the existing subscription status even when subscriptions are closed', () => {
    expect(getHomeView('pending', null, { subscriptionMode: 'closed' })).toEqual({
      kind: 'pendingTeam',
    })
  })

  it('ignores waiting-list mode once a subscription exists, since the mode only shapes new ones', () => {
    expect(getHomeView('pending', null, { subscriptionMode: 'waiting_list' })).toEqual({
      kind: 'pendingTeam',
    })
  })

  it('returns pendingTeam for pending status without a team', () => {
    expect(getHomeView('pending', null)).toEqual({ kind: 'pendingTeam' })
  })

  it('returns pendingTeam for received status without a team', () => {
    expect(getHomeView('received', null)).toEqual({ kind: 'pendingTeam' })
  })

  it('returns pendingTeam for completed status without a team', () => {
    expect(getHomeView('completed', null)).toEqual({ kind: 'pendingTeam' })
  })

  it('returns assignedTeam for completed status with a team when the MyTeam flag is on', () => {
    expect(getHomeView('completed', team, { myTeamEnabled: true })).toEqual({
      kind: 'assignedTeam',
      team,
    })
  })

  it('falls back to pendingTeam for completed status with a team when the MyTeam flag is off', () => {
    expect(getHomeView('completed', team)).toEqual({ kind: 'pendingTeam' })
    expect(getHomeView('completed', team, { myTeamEnabled: false })).toEqual({
      kind: 'pendingTeam',
    })
  })

  it('returns waitingList for waiting_list status regardless of team presence', () => {
    expect(getHomeView('waiting_list', null)).toEqual({ kind: 'waitingList' })
    expect(getHomeView('waiting_list', team)).toEqual({ kind: 'waitingList' })
  })
})
