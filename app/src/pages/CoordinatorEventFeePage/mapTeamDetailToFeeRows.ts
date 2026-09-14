import type {
  TeamDetail,
  TeamMembershipType,
  TeamRosterPerson,
} from '../../services/teams/teams.types'
import type { TeamMemberFeeRow } from '../../services/finance/finance.types'

function toFeeRow(person: TeamRosterPerson, membershipType: TeamMembershipType): TeamMemberFeeRow {
  return {
    userId: person.userId,
    name: person.name,
    nickname: person.nickname,
    phone: person.phone,
    pictureUrl: person.pictureUrl,
    experienceType: person.experienceType,
    circleKey: person.circleKey,
    membershipType,
    // Same union, different name: the roster calls it `eventFeeStatus` because a
    // person there is not primarily a fee row, and the fee card calls it
    // `status` because on that screen they are.
    status: person.eventFeeStatus,
  }
}

/**
 * Flattens a team roster into the rows the fee card renders.
 *
 * `TeamDetail` already carries every field a `TeamMemberFeeRow` needs, so the
 * coordinator page reads the team endpoint rather than a parallel finance one —
 * a second endpoint would duplicate coordinator resolution to return data this
 * one already returns.
 *
 * `membershipType` is not a field on the roster: it is which array the person
 * sat in. That is also why coordinators come first — they are their own section
 * on the team page, and the fee list keeps the same order so a coordinator finds
 * themselves where they expect to be.
 *
 * Only a coordinator reaches this page, but the rows are not filtered to
 * members: coordinators owe the fee too, and the API lets a coordinator confirm
 * for their fellow coordinators for exactly that reason.
 */
export function mapTeamDetailToFeeRows(team: TeamDetail | null | undefined): TeamMemberFeeRow[] {
  if (!team) {
    return []
  }

  return [
    ...team.coordinators.map((person) => toFeeRow(person, 'coordinator')),
    ...team.members.map((person) => toFeeRow(person, 'member')),
  ]
}
