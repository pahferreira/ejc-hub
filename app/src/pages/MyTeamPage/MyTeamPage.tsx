import { TeamDetailContent } from '../../components/TeamDetailContent/TeamDetailContent'
import { useMyTeamQuery } from '../../services/teams/useMyTeamQuery'
import { useCurrentEventSubscriptionStatusQuery } from '../../services/events/useCurrentEventSubscriptionStatusQuery'
import { useMyTeamAttendanceQuery } from '../../services/attendance/useMyTeamAttendanceQuery'
import { useMyAttendanceQuery } from '../../services/attendance/useMyAttendanceQuery'
import { useCurrentUserQuery } from '../../services/users/useCurrentUserQuery'
import { useFeatureFlag } from '../../hooks/useFeatureFlag/useFeatureFlag'
import { FeatureFlag } from '../../hooks/useFeatureFlag/feature-flags'
import { myTeamCardAttendanceRates } from './myTeamCardAttendanceRates'

/**
 * The Presença rates for the My Team cards. Coordinators read the whole roster
 * (behind `attendance-visibility` and `coordinator-attendance`); members read
 * only their own (behind `attendance-visibility`). Each query is gated on its
 * audience because the other one 403s. The cards never wait on it: until it
 * loads, or if it fails, they simply show no block.
 */
function useMyTeamCardAttendanceRates() {
  const subscriptionStatus = useCurrentEventSubscriptionStatusQuery()
  const currentUser = useCurrentUserQuery()
  const { isFeatureEnabled } = useFeatureFlag()
  const hasTeam = Boolean(subscriptionStatus.data?.assignedTeam)
  const isCoordinator = subscriptionStatus.data?.myMembershipType === 'coordinator'
  const isVisible = isFeatureEnabled(FeatureFlag.AttendanceVisibility, false)

  const readsTeam =
    isVisible && isCoordinator && isFeatureEnabled(FeatureFlag.CoordinatorAttendance, false)
  const readsOwn = isVisible && hasTeam && !isCoordinator

  const teamAttendanceQuery = useMyTeamAttendanceQuery({ enabled: readsTeam })
  const myAttendanceQuery = useMyAttendanceQuery({ enabled: readsOwn })

  return myTeamCardAttendanceRates({
    teamModel: readsTeam ? teamAttendanceQuery.data : undefined,
    myModel: readsOwn ? myAttendanceQuery.data : undefined,
    currentUserId: currentUser.data?.id,
  })
}

export function MyTeamPage() {
  const teamQuery = useMyTeamQuery()
  const attendanceRates = useMyTeamCardAttendanceRates()

  if (teamQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando equipe...</div>
      </div>
    )
  }

  if (teamQuery.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Não foi possível carregar sua equipe.</div>
      </div>
    )
  }

  const team = teamQuery.data

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-8xl mx-auto flex flex-col gap-6">
        {team ? (
          <TeamDetailContent team={team} attendanceRates={attendanceRates} />
        ) : (
          <div className="rounded-xl border border-tertiary bg-white px-6 py-12 text-center shadow-md">
            <p className="m-0 text-sm text-gray-600">
              Você ainda não faz parte de uma equipe neste evento.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
