import type { ReactNode } from 'react'
import { TeamDetailHeaderCard } from '../TeamDetailHeaderCard/TeamDetailHeaderCard'
import { SectionHeader } from '../SectionHeader/SectionHeader'
import { PersonCardEmptySlot } from '../PersonCardEmptySlot/PersonCardEmptySlot'
import { TeamPersonCard } from '../TeamPersonCard/TeamPersonCard'
import type { TeamDetail, TeamPerson } from '../../services/teams/teams.types'
import type { AttendanceRate } from '../../services/attendance/attendance.types'

export type TeamDetailContentProps = {
  team: TeamDetail
  /** Right-aligned action for the "Coordenadores" section (e.g. add button). Omitted → read-only. */
  coordinatorsAction?: ReactNode
  /** Right-aligned action for the "Membros" section (e.g. add button). Omitted → read-only. */
  membersAction?: ReactNode
  /** When provided, member cards render a remove affordance. Omitted → read-only. */
  onRemoveMember?: (member: TeamPerson) => void
  /**
   * Attendance rates keyed by user id. A card whose person has no entry shows no
   * Presença block, so the caller decides who sees whose rate. Omitted → none.
   */
  attendanceRates?: Record<string, AttendanceRate>
}

/**
 * Presentational team detail: header stats + coordinators + members. Owns no
 * data fetching, page chrome, or action wiring — callers pass actions as slots,
 * so a caller that passes none (e.g. the My Team page) renders fully read-only.
 */
export function TeamDetailContent(props: TeamDetailContentProps) {
  const team = props.team
  const emptyCoordinatorSlots = Math.max(0, team.coordinatorSlots - team.coordinators.length)

  return (
    <div className="flex flex-col gap-6">
      <TeamDetailHeaderCard
        name={team.name}
        description={team.description ?? undefined}
        memberCount={team.memberCount}
        maxCapacity={team.maxCapacity}
        freeSlots={team.freeSlots}
        filledPercentage={team.filledPercentage}
      />

      <div className="flex flex-col gap-4">
        <SectionHeader title="Coordenadores" action={props.coordinatorsAction} />
        {/* Open-slot placeholders are an "add coordinator" affordance, so they
            only make sense when the section is actionable. Read-only callers
            (e.g. the My Team page) get an empty message instead, mirroring the
            Membros section. */}
        {team.coordinators.length === 0 && !props.coordinatorsAction ? (
          <div className="text-gray-500">Nenhum coordenador atribuído a esta equipe.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {team.coordinators.map((coordinator) => (
              <TeamPersonCard
                key={coordinator.userId}
                person={coordinator}
                role="Coordenador"
                attendanceRate={props.attendanceRates?.[coordinator.userId]}
              />
            ))}
            {props.coordinatorsAction &&
              Array.from({ length: emptyCoordinatorSlots }).map((_, index) => (
                <PersonCardEmptySlot key={`empty-coordinator-${index}`} teamName={team.name} />
              ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <SectionHeader title="Membros" action={props.membersAction} />
        {team.members.length === 0 ? (
          <div className="text-gray-500">Nenhum membro atribuído a esta equipe.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {team.members.map((member) => (
              <TeamPersonCard
                key={member.userId}
                person={member}
                attendanceRate={props.attendanceRates?.[member.userId]}
                onRemove={props.onRemoveMember ? () => props.onRemoveMember?.(member) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
