import { FiXCircle } from 'react-icons/fi'
import { StatusCard } from '../../components/StatusCard/StatusCard'
import { FeeByTeamCard } from '../../components/FeeByTeamCard/FeeByTeamCard'
import { useCurrentEventQuery } from '../../services/events/useCurrentEventQuery'
import { useEventFeeOverviewQuery } from '../../services/finance/useEventFeeOverviewQuery'
import type { EventFeeOverview } from '../../services/finance/finance.types'

const EMPTY_OVERVIEW: EventFeeOverview = {
  totalMembers: 0,
  paidCount: 0,
  pendingCount: 0,
  paidPercentage: 0,
  teams: [],
}

export function EventFeePage() {
  const eventQuery = useCurrentEventQuery()
  const overviewQuery = useEventFeeOverviewQuery()

  if (overviewQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando taxas de inscrição...</div>
      </div>
    )
  }

  if (overviewQuery.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Error: {overviewQuery.error.message}</div>
      </div>
    )
  }

  const overview = overviewQuery.data ?? EMPTY_OVERVIEW
  const eventName = eventQuery.data?.name

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-8xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 m-0">Taxa de Inscrição</h1>
          <p className="mt-2 text-gray-600">
            Visão geral dos pagamentos por equipe{eventName ? ` para o ${eventName}` : ''}.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatusCard
            title="Total de Membros nas Equipes"
            value={overview.totalMembers}
            variant="neutral"
            description="membros e coordenadores das equipes"
          />
          <StatusCard
            title="Taxas Pagas"
            value={overview.paidCount}
            variant="success"
            description={`${overview.paidPercentage}% do total`}
          />
          <StatusCard
            title="Taxas Pendentes"
            value={overview.pendingCount}
            variant="error"
            description={`${100 - overview.paidPercentage}% do total`}
            icon={<FiXCircle size="24px" />}
          />
          <StatusCard
            title="Taxa de Pagamento Global"
            value={`${overview.paidPercentage}%`}
            variant="info"
            description={`${overview.paidCount} de ${overview.totalMembers} membros`}
          />
        </div>

        <FeeByTeamCard rows={overview.teams} overallPaidPercentage={overview.paidPercentage} />
      </div>
    </div>
  )
}
