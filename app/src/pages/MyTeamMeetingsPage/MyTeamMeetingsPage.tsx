import { FiAlertTriangle, FiCalendar, FiFileText } from 'react-icons/fi'
import { Button } from '../../components/Button/Button'
import { MeetingList } from '../../components/MeetingList/MeetingList'
import { MembersAttendanceTable } from '../../components/MembersAttendanceTable/MembersAttendanceTable'
import { MeetingDrawer } from '../../components/MeetingDrawer/MeetingDrawer'
import { useMeetingForm } from '../../components/MeetingDrawer/useMeetingForm'
import { useCurrentEventSubscriptionStatusQuery } from '../../services/events/useCurrentEventSubscriptionStatusQuery'
import { useMyTeamAttendanceQuery } from '../../services/attendance/useMyTeamAttendanceQuery'
import { useMyAttendanceQuery } from '../../services/attendance/useMyAttendanceQuery'
import { useFeatureFlag } from '../../hooks/useFeatureFlag/useFeatureFlag'
import { FeatureFlag } from '../../hooks/useFeatureFlag/feature-flags'
import { MemberAttendanceHistory } from '../../components/MemberAttendanceHistory/MemberAttendanceHistory'
import { StatusCard } from '../../components/StatusCard/StatusCard'
import { formatRateFraction } from '../../components/AttendanceRate/attendanceRate'
import type { CoordinatorAttendanceReadModel } from '../../services/attendance/attendance.types'

// The Média card's value and line. The value slot is large, so it holds the
// percentage alone and the fraction moves to the description.
function teamAverageCard(model: CoordinatorAttendanceReadModel) {
  const rate = model.teamAverage

  if (rate.band === 'no-meetings') {
    return { value: '-', description: 'Nenhuma reunião registrada' }
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
    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 lg:grid-cols-5">
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
 * The coordinator board: stat chips, the meeting list with **Registrar
 * reunião**, and the Membros table. Clicking a meeting opens the same drawer in
 * edit mode, with delete.
 */
function CoordinatorMeetingsView(props: {
  model: CoordinatorAttendanceReadModel
  teamName: string
}) {
  const { model } = props
  const meetingDrawer = useMeetingForm(model.roster)

  const hasMeetings = model.meetings.length > 0
  const firstMeetingHeldOn = hasMeetings
    ? model.meetings[model.meetings.length - 1].heldOn
    : undefined

  return (
    <>
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
          <Button onClick={meetingDrawer.openNew}>Registrar reunião</Button>
        </div>

        {hasMeetings ? (
          <MeetingList meetings={model.meetings} onSelectMeeting={meetingDrawer.openEdit} />
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

      <MeetingDrawer {...meetingDrawer} teamName={props.teamName} />
    </>
  )
}

/**
 * "Reuniões": one route, two views of the caller's own team.
 *
 * Coordinators get the board (behind `coordinator-attendance`); everyone else
 * on a team gets their own Histórico de presença (behind `attendance-visibility`).
 * Structurally `RequestMembersPage`: the error branch stays above the "not for
 * you" one so a dropped request is never read as a verdict, and each query is
 * gated on its view so an endpoint's 403 does not race into the generic error
 * branch.
 */
export function MyTeamMeetingsPage() {
  const subscriptionStatus = useCurrentEventSubscriptionStatusQuery()
  const { isFeatureEnabled } = useFeatureFlag()
  const hasTeam = Boolean(subscriptionStatus.data?.assignedTeam)
  const isCoordinator = subscriptionStatus.data?.myMembershipType === 'coordinator'

  const showsCoordinatorView =
    isCoordinator && isFeatureEnabled(FeatureFlag.CoordinatorAttendance, false)
  const showsMemberView =
    hasTeam && !isCoordinator && isFeatureEnabled(FeatureFlag.AttendanceVisibility, false)

  const teamAttendanceQuery = useMyTeamAttendanceQuery({ enabled: showsCoordinatorView })
  const myAttendanceQuery = useMyAttendanceQuery({ enabled: showsMemberView })

  if (
    subscriptionStatus.isLoading ||
    teamAttendanceQuery.isLoading ||
    myAttendanceQuery.isLoading
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando reuniões...</div>
      </div>
    )
  }

  if (subscriptionStatus.error || teamAttendanceQuery.error || myAttendanceQuery.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Não foi possível carregar as reuniões da equipe.</div>
      </div>
    )
  }

  // After the error branch: a dropped status request leaves the membership
  // undefined, which read as a verdict would tell a team member the page is
  // not for them when all that happened was a failed fetch.
  // The route opens on either flag, so someone on a team may land here while
  // their own view is still off: say so rather than deny they are on a team.
  if (!showsCoordinatorView && !showsMemberView) {
    return (
      <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-8xl mx-auto rounded-xl border border-tertiary bg-white px-6 py-12 text-center shadow-md">
          <p className="m-0 text-sm text-gray-600">
            {hasTeam
              ? 'As reuniões da equipe ainda não estão disponíveis para você.'
              : 'Esta página é exclusiva para membros de uma equipe.'}
          </p>
        </div>
      </div>
    )
  }

  const teamName = subscriptionStatus.data?.assignedTeam?.name ?? 'Minha equipe'
  const teamModel = teamAttendanceQuery.data
  const myModel = myAttendanceQuery.data

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-8xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 m-0">Reuniões</h1>
          <p className="mt-2 text-gray-600">{teamName} · presença nas reuniões da equipe</p>
        </header>

        {showsCoordinatorView && teamModel && (
          <CoordinatorMeetingsView model={teamModel} teamName={teamName} />
        )}
        {showsMemberView && myModel && <MemberAttendanceHistory model={myModel} />}
      </div>
    </div>
  )
}
