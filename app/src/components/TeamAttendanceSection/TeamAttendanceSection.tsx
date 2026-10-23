import { FiCalendar, FiFileText } from 'react-icons/fi'
import { MeetingList } from '../MeetingList/MeetingList'
import { StatusCard } from '../StatusCard/StatusCard'
import { justifiedStat, teamAverageStat } from '../AttendanceRate/attendanceStats'
import type { CoordinatorAttendanceReadModel } from '../../services/attendance/attendance.types'

export type TeamAttendanceSectionProps = {
  model: CoordinatorAttendanceReadModel
}

/**
 * Admin Team Detail's attendance: the Média, Reuniões and Justificadas chips
 * over the team's meeting list, read-only. Derived from the coordinator
 * Reuniões page, minus every write affordance (issue #283).
 */
export function TeamAttendanceSection(props: TeamAttendanceSectionProps) {
  const { model } = props
  const average = teamAverageStat(model.teamAverage)
  const justified = justifiedStat(model)

  return (
    <section className="flex flex-col gap-4">
      <h2 className="m-0 text-xl font-semibold text-dark-brown">Reuniões · {model.meetingCount}</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatusCard
          title="Média"
          value={average.value}
          variant="info"
          description={average.description}
        />
        <StatusCard
          title="Reuniões"
          value={model.meetingCount}
          variant="neutral"
          icon={<FiCalendar size="24px" />}
          description="registradas"
        />
        <StatusCard
          title="Justificadas"
          value={justified.value}
          variant="pending"
          icon={<FiFileText size="24px" />}
          description={justified.description}
        />
      </div>

      <MeetingList
        meetings={model.meetings}
        readOnly
        emptyMessage={
          <div className="rounded-xl border border-dashed border-tertiary bg-white px-6 py-12 text-center">
            <p className="m-0 text-sm text-gray-600">Nenhuma reunião registrada ainda.</p>
          </div>
        }
      />
    </section>
  )
}
