import { useParams, useNavigate } from 'react-router'
import { FiArrowLeft } from 'react-icons/fi'
import { TeamDetailContent } from '../../components/TeamDetailContent/TeamDetailContent'
import { Button } from '../../components/Button/Button'
import { useAssignCoordinatorDrawer } from '../../components/AssignCoordinatorDrawer/useAssignCoordinatorDrawer'
import { AssignCoordinatorDrawer } from '../../components/AssignCoordinatorDrawer/AssignCoordinatorDrawer'
import { useAddMembersDrawer } from '../../components/AddMembersDrawer/useAddMembersDrawer'
import { AddMembersDrawer } from '../../components/AddMembersDrawer/AddMembersDrawer'
import { useTeamDetailQuery } from '../../services/teams/useTeamDetailQuery'
import { useRemoveTeamMemberMutation } from '../../services/teams/useRemoveTeamMemberMutation'
import { ROUTE_PATHS } from '../../constants/routePaths'
import { TeamAttendanceSection } from '../../components/TeamAttendanceSection/TeamAttendanceSection'
import { useTeamAttendanceQuery } from '../../services/attendance/useTeamAttendanceQuery'
import { useAuthentication } from '../../hooks/useAuthentication'
import { useFeatureFlag } from '../../hooks/useFeatureFlag/useFeatureFlag'
import { FeatureFlag } from '../../hooks/useFeatureFlag/feature-flags'
import { AttendancePermissions, hasPermission } from '../../../../common/permissions'
import { myTeamCardAttendanceRates } from '../MyTeamPage/myTeamCardAttendanceRates'

export function TeamDetailPage() {
  const navigate = useNavigate()
  const { teamKey } = useParams()
  const teamQuery = useTeamDetailQuery(teamKey)
  const drawer = useAssignCoordinatorDrawer()
  const addMembersDrawer = useAddMembersDrawer()
  const removeMemberMutation = useRemoveTeamMemberMutation()
  const { permissions } = useAuthentication()
  const { isFeatureEnabled } = useFeatureFlag()

  // Attendance is its own read behind its own permission, never part of the
  // team payload: an admin with only `team-instances:read` sees none of it.
  const showsAttendance =
    hasPermission(permissions, AttendancePermissions.Read) &&
    isFeatureEnabled(FeatureFlag.AttendanceVisibility, false)
  const attendanceQuery = useTeamAttendanceQuery(teamQuery.data?.id, {
    enabled: showsAttendance,
  })

  if (teamQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando equipe...</div>
      </div>
    )
  }

  if (teamQuery.error || !teamQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Equipe não encontrada.</div>
      </div>
    )
  }

  const team = teamQuery.data
  const attendanceModel = showsAttendance ? attendanceQuery.data : undefined

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-8xl mx-auto flex flex-col gap-6">
        <button
          type="button"
          onClick={() => navigate(ROUTE_PATHS.TEAMS)}
          className="flex w-fit items-center gap-2 text-sm font-medium text-dark-brown hover:cursor-pointer hover:underline"
        >
          <FiArrowLeft aria-hidden="true" />
          Voltar para Equipes
        </button>

        <TeamDetailContent
          team={team}
          coordinatorsAction={
            <Button onClick={() => drawer.open({ id: team.id, name: team.name })}>
              + Adicionar Coordenador
            </Button>
          }
          membersAction={
            <Button
              onClick={() =>
                addMembersDrawer.open({
                  id: team.id,
                  name: team.name,
                  memberCount: team.memberCount,
                  maxCapacity: team.maxCapacity,
                })
              }
            >
              + Adicionar Membro
            </Button>
          }
          onRemoveMember={(member) =>
            removeMemberMutation.mutate({
              teamId: team.id,
              memberId: member.userId,
              teamKey: team.templateKey,
            })
          }
          attendanceRates={myTeamCardAttendanceRates({ teamModel: attendanceModel })}
        />

        {attendanceModel && <TeamAttendanceSection model={attendanceModel} />}
        {showsAttendance && attendanceQuery.error && (
          <div className="text-red-600">Não foi possível carregar as reuniões da equipe.</div>
        )}
      </div>

      <AssignCoordinatorDrawer {...drawer} />
      <AddMembersDrawer {...addMembersDrawer} />
    </div>
  )
}
