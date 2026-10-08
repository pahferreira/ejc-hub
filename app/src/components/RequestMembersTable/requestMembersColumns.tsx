import { createColumnHelper } from '@tanstack/react-table'
import { ExperienceBadge } from '../ExperienceBadge/ExperienceBadge'
import { TruncatedPillList } from '../TruncatedPillList/TruncatedPillList'
import { UserAvatar } from '../UserAvatar/UserAvatar'
import { RequestMemberRowAction } from './RequestMemberRowAction'
import type { ExperienceType } from '../../services/team-building/team-building.types'
import { TeamAvatar } from '../TeamAvatar/TeamAvatar'

/**
 * Where a person stands relative to the coordinator's own team.
 *
 * Mirrors the API's `RequestRowStatus`
 * (`api/src/features/member-request/domain/member-request.types.ts`). `assigned`
 * renders on nothing today — `#listEligibleSubscribers` excludes anyone already
 * placed (plan decision D2, provisional) — but stays in the union and is given
 * a real row treatment (see `RequestMemberRowAction`) so widening the API later
 * does not also mean reopening this component.
 */
export type RequestMemberRowStatus = 'requested' | 'requestable' | 'assigned'

/** A team the person put on their signup form. Mirrors the API's `TeamPreference`. */
export type RequestMemberTeamPreference = {
  teamInstanceId: string
  name: string
}

/**
 * One person a coordinator may ask for.
 *
 * Mirrors the API's `RequestableCandidateRow` field for field, deliberately
 * defined here rather than imported from a service: this component ships on
 * `feat/request-members-ui-components`, a branch with no API dependency (plan
 * G.7), while `RequestMembersPage`'s service-layer type is built on the
 * following branch. The two are structurally identical, so no conversion is
 * needed where they meet. No `phone`, no `email` — plan decision D3.
 */
export type RequestMemberRow = {
  userId: string
  name: string
  /** The person's nickname, falling back to their first name when unset. */
  nickname: string
  pictureUrl: string | null
  experienceType: ExperienceType
  /** Key of the person's circle (newbies only); null when unset. */
  circleKey: string | null
  /** Skill-derived labels shown as pills (e.g. ["Comunicação"]). */
  areas: string[]
  preferences: RequestMemberTeamPreference[]
  rowStatus: RequestMemberRowStatus
}

export type RequestMembersColumnsOptions = {
  onRequest: (row: RequestMemberRow) => void
}

const columnHelper = createColumnHelper<RequestMemberRow>()

/**
 * A factory, not a module-level array: the action cell closes over the live
 * `onRequest` callback, per `createEventFeeMembersColumns`.
 */
export function createRequestMembersColumns(options: RequestMembersColumnsOptions) {
  return [
    columnHelper.accessor('nickname', {
      header: 'Nome',
      cell: (info) => (
        <div className="flex items-center gap-3">
          <UserAvatar name={info.row.original.name} pictureUrl={info.row.original.pictureUrl} />
          <div className="flex min-w-0 flex-col gap-1">
            <span className="font-semibold text-dark-brown">{info.getValue()}</span>
            <span className="text-xs font-medium text-secondary-foreground">
              {info.row.original.name}
            </span>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('areas', {
      header: 'Habilidades',
      // Capped at four: a candidate who ticked nine skills wrapped the row onto
      // three lines, which pushed every other column's content out of
      // alignment. The rest stay one click away rather than being dropped.
      cell: (info) => <TruncatedPillList items={info.getValue()} itemNoun="habilidades" />,
    }),
    columnHelper.accessor('preferences', {
      header: 'Escolhas de Equipe',
      cell: (info) => (
        <div className="flex gap-1">
          {info.getValue().map((teamPreference) => (
            <TeamAvatar key={teamPreference.teamInstanceId} name={teamPreference.name} size="sm" />
          ))}
        </div>
      ),
    }),
    columnHelper.accessor('experienceType', {
      header: 'Experiência',
      cell: (info) => (
        <ExperienceBadge experienceType={info.getValue()} circleKey={info.row.original.circleKey} />
      ),
    }),
    columnHelper.display({
      id: 'action',
      header: 'Ação',
      meta: { className: 'text-right' },
      cell: (info) => (
        <RequestMemberRowAction row={info.row.original} onRequest={options.onRequest} />
      ),
    }),
  ]
}
