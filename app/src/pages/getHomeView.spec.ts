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
    expect(getHomeView(null, null)).toEqual({ kind: 'subscribe' })
  })

  it('returns subscribe even if a stale assignedTeam was provided alongside null status', () => {
    expect(getHomeView(null, team)).toEqual({ kind: 'subscribe' })
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

  it('returns assignedTeam for completed status with a team', () => {
    expect(getHomeView('completed', team)).toEqual({ kind: 'assignedTeam', team })
  })

  it('returns waitingList for waiting_list status regardless of team presence', () => {
    expect(getHomeView('waiting_list', null)).toEqual({ kind: 'waitingList' })
    expect(getHomeView('waiting_list', team)).toEqual({ kind: 'waitingList' })
  })
})
