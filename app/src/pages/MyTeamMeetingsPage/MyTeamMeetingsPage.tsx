import { FiAlertTriangle, FiCalendar, FiFileText } from 'react-icons/fi'
import { Button } from '../../components/Button/Button'
import { MeetingList } from '../../components/MeetingList/MeetingList'
import { MembersAttendanceTable } from '../../components/MembersAttendanceTable/MembersAttendanceTable'
import { RegisterMeetingDrawer } from '../../components/RegisterMeetingDrawer/RegisterMeetingDrawer'
import { useRegisterMeetingForm } from '../../components/RegisterMeetingDrawer/useRegisterMeetingForm'
import { useCurrentEventSubscriptionStatusQuery } from '../../services/events/useCurrentEventSubscriptionStatusQuery'
import { useMyTeamAttendanceQuery } from '../../services/attendance/useMyTeamAttendanceQuery'
import { StatusCard } from '../../components/StatusCard/StatusCard'
import { formatRateFraction } from '../../components/AttendanceRate/attendanceRate'
import type { CoordinatorAttendanceReadModel } from '../../services/attendance/attendance.types'

// The Média card's value and line. The value slot is large, so it holds the
// percentage alone and the fraction moves to the description.
function teamAverageCard(model: CoordinatorAttendanceReadModel) {
  const rate = model.teamAverage

  if (rate.band === 'no-meetings') {
    return { value: '—', description: 'Nenhuma reunião registrada' }
  }

  const fraction = formatRateFraction(rate)
  const description =
    rate.band === 'insufficient-data' ? `${fraction} · poucos dados` : `${fraction} presenças`

  return { value: `${rate.percentage}%`, description }
}

function justifiedDescription(model: CoordinatorAttendanceReadModel): string {
  const percentage =
    model.totalRows > 0 ? Math.round((model.justifiedTotal / model.totalRows) * 100) : 0
  return `de ${model.totalRows} · ${percentage}%`
}

function AttendanceStats(props: { model: CoordinatorAttendanceReadModel }) {
  const { model } = props
  const average = teamAverageCard(model)

  return (
    <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
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
        value={model.justifiedTotal}
        variant="pending"
        icon={<FiFileText size="24px" />}
        description={justifiedDescription(model)}
      />
      <StatusCard
        title="Em risco"
        value={model.bandCounts.risky}
        variant="pending"
        icon={<FiAlertTriangle size="24px" />}
        description="50–74% de presença"
      />
      <StatusCard
        title="Precisa substituir"
        value={model.bandCounts['needs-replacement']}
        variant="error"
        description="abaixo de 50%"
      />
    </div>
  )
}

/**
 * "Reuniões": a coordinator's read of their team's attendance.
 *
 * Structurally `RequestMembersPage` — the coordinator check and its branch order
 * are the same, verbatim: the error branch stays above the not-a-coordinator one
 * so a dropped request is never read as a verdict, and the query is gated on
 * `isCoordinator` so the endpoint's 403 does not race into the generic error
 * branch. Editing and deleting meetings come with #280.
 */
export function MyTeamMeetingsPage() {
  const subscriptionStatus = useCurrentEventSubscriptionStatusQuery()
  const isCoordinator = subscriptionStatus.data?.myMembershipType === 'coordinator'

  const attendanceQuery = useMyTeamAttendanceQuery({ enabled: isCoordinator })
  // Above the early returns, so it reads an empty roster until the model lands.
  const registerDrawer = useRegisterMeetingForm(attendanceQuery.data?.roster ?? [])

  if (subscriptionStatus.isLoading || attendanceQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando reuniões...</div>
      </div>
    )
  }

  if (subscriptionStatus.error || attendanceQuery.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Não foi possível carregar as reuniões da equipe.</div>
      </div>
    )
  }

  // After the error branch: a dropped status request leaves `myMembershipType`
  // undefined, which read as a verdict would tell a coordinator the page is not
  // for them when all that happened was a failed fetch.
  if (!isCoordinator) {
    return (
      <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-8xl mx-auto rounded-xl border border-tertiary bg-white px-6 py-12 text-center shadow-md">
          <p className="m-0 text-sm text-gray-600">
            Esta página é exclusiva para coordenadores de equipe.
          </p>
        </div>
      </div>
    )
  }

  const model = attendanceQuery.data

  if (!model) {
    return null
  }

  const teamName = subscriptionStatus.data?.assignedTeam?.name ?? 'Minha equipe'
  const hasMeetings = model.meetings.length > 0
  const firstMeetingHeldOn = hasMeetings
    ? model.meetings[model.meetings.length - 1].heldOn
    : undefined

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-8xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 m-0">Reuniões</h1>
          <p className="mt-2 text-gray-600">{teamName} · presença nas reuniões da equipe</p>
        </header>

        <AttendanceStats model={model} />

        <section className="mb-10">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="m-0 text-xl font-semibold text-dark-brown">
                Reuniões · {model.meetingCount}
              </h2>
              <p className="mt-1 m-0 text-sm text-gray-600">
                Registre cada reunião depois que ela acontecer. Clique numa reunião para editar.
              </p>
            </div>
            <Button onClick={registerDrawer.open}>Registrar reunião</Button>
          </div>

          {hasMeetings ? (
            <MeetingList meetings={model.meetings} />
          ) : (
            <div className="rounded-xl border border-dashed border-tertiary bg-white px-6 py-12 text-center">
              <p className="m-0 text-sm text-gray-600">
                Nenhuma reunião registrada ainda. Registre a primeira depois que ela acontecer.
              </p>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 m-0 text-xl font-semibold text-dark-brown">
            Membros · {model.roster.length}
          </h2>
          <MembersAttendanceTable members={model.roster} firstMeetingHeldOn={firstMeetingHeldOn} />
        </section>
      </div>

      <RegisterMeetingDrawer {...registerDrawer} teamName={teamName} />
    </div>
  )
}
