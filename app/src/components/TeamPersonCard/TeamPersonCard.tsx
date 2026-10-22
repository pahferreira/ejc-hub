import { PersonCard } from '../PersonCard/PersonCard'
import { ExperienceBadge } from '../ExperienceBadge/ExperienceBadge'
import { MemberFeeStatusPill } from '../TeamMembersFeeCard/MemberFeeStatusPill'
import { PersonAttendanceBlock } from '../PersonAttendanceBlock/PersonAttendanceBlock'
import type { TeamRosterPerson } from '../../services/teams/teams.types'
import type { AttendanceRate } from '../../services/attendance/attendance.types'

export type TeamPersonCardProps = {
  person: TeamRosterPerson
  /** Role label shown next to the name (e.g. "Coordenador"). Omitted for members. */
  role?: string
  /** The person's attendance rate. Omitted renders no Presença block. */
  attendanceRate?: AttendanceRate
  /** Shows a top-right delete button when provided. */
  onRemove?: () => void
}

/** Maps a TeamPerson (coordinator or member) onto the presentational PersonCard. */
export function TeamPersonCard(props: TeamPersonCardProps) {
  return (
    <PersonCard
      name={props.person.name}
      nickname={props.person.nickname}
      badge={
        <ExperienceBadge
          experienceType={props.person.experienceType}
          circleKey={props.person.circleKey}
        />
      }
      phone={props.person.phone ?? undefined}
      avatarUrl={props.person.pictureUrl ?? undefined}
      attributes={props.person.areas}
      weekAvailability={props.person.weekAvailability}
      role={props.role}
      showStatusChips
      // The same pill the treasurer's member list uses, so "Pago"/"Pendente"
      // reads identically on a roster card and on the financial screens.
      feeStatusChip={<MemberFeeStatusPill status={props.person.eventFeeStatus} />}
      attendance={
        props.attendanceRate && (
          <PersonAttendanceBlock
            rate={props.attendanceRate}
            label={`Presença de ${props.person.nickname}`}
          />
        )
      }
      onRemove={props.onRemove}
    />
  )
}
