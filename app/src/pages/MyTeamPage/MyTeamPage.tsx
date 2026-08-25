import { TeamDetailContent } from '../../components/TeamDetailContent/TeamDetailContent'
import { useMyTeamQuery } from '../../services/teams/useMyTeamQuery'

export function MyTeamPage() {
  const teamQuery = useMyTeamQuery()

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
          <TeamDetailContent team={team} />
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
