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

export function TeamDetailPage() {
  const navigate = useNavigate()
  const { teamKey } = useParams()
  const teamQuery = useTeamDetailQuery(teamKey)
  const drawer = useAssignCoordinatorDrawer()
  const addMembersDrawer = useAddMembersDrawer()
  const removeMemberMutation = useRemoveTeamMemberMutation()

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
        />
      </div>

      <AssignCoordinatorDrawer {...drawer} />
      <AddMembersDrawer {...addMembersDrawer} />
    </div>
  )
}
