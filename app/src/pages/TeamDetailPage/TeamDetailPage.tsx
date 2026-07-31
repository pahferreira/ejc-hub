import { useParams, useNavigate } from 'react-router'
import { FiArrowLeft } from 'react-icons/fi'
import { TeamDetailHeaderCard } from '../../components/TeamDetailHeaderCard/TeamDetailHeaderCard'
import { SectionHeader } from '../../components/SectionHeader/SectionHeader'
import { PersonCardEmptySlot } from '../../components/PersonCardEmptySlot/PersonCardEmptySlot'
import { Button } from '../../components/Button/Button'
import { useAssignCoordinatorDrawer } from '../../components/AssignCoordinatorDrawer/useAssignCoordinatorDrawer'
import { AssignCoordinatorDrawer } from '../../components/AssignCoordinatorDrawer/AssignCoordinatorDrawer'
import { useAddMembersDrawer } from '../../components/AddMembersDrawer/useAddMembersDrawer'
import { AddMembersDrawer } from '../../components/AddMembersDrawer/AddMembersDrawer'
import { useTeamDetailQuery } from '../../services/teams/useTeamDetailQuery'
import { useRemoveTeamMemberMutation } from '../../services/teams/useRemoveTeamMemberMutation'
import { ROUTE_PATHS } from '../../constants/routePaths'
import { TeamPersonCard } from './TeamPersonCard'

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
  const emptyCoordinatorSlots = Math.max(0, team.coordinatorSlots - team.coordinators.length)

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

        <TeamDetailHeaderCard
          name={team.name}
          description={team.description ?? undefined}
          memberCount={team.memberCount}
          maxCapacity={team.maxCapacity}
          freeSlots={team.freeSlots}
          filledPercentage={team.filledPercentage}
        />

        <div className="flex flex-col gap-4">
          <SectionHeader
            title="Coordenadores"
            action={
              <Button onClick={() => drawer.open({ id: team.id, name: team.name })}>
                + Adicionar Coordenador
              </Button>
            }
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {team.coordinators.map((coordinator) => (
              <TeamPersonCard key={coordinator.userId} person={coordinator} role="Coordenador" />
            ))}
            {Array.from({ length: emptyCoordinatorSlots }).map((_, index) => (
              <PersonCardEmptySlot key={`empty-coordinator-${index}`} teamName={team.name} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <SectionHeader
            title="Membros"
            action={
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
          />
          {team.members.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Nenhum membro atribuído a esta equipe.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {team.members.map((member) => (
                <TeamPersonCard
                  key={member.userId}
                  person={member}
                  onRemove={() =>
                    removeMemberMutation.mutate({
                      teamId: team.id,
                      memberId: member.userId,
                      teamKey: team.templateKey,
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AssignCoordinatorDrawer {...drawer} />
      <AddMembersDrawer {...addMembersDrawer} />
    </div>
  )
}
