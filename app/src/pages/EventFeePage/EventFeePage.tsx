import { FiGift, FiXCircle } from 'react-icons/fi'
import { StatusCard } from '../../components/StatusCard/StatusCard'
import { FeeByTeamCard } from '../../components/FeeByTeamCard/FeeByTeamCard'
import { useCurrentEventQuery } from '../../services/events/useCurrentEventQuery'
import { useEventFeeTeamsOverviewQuery } from '../../services/finance/useEventFeeTeamsOverviewQuery'
import { formatCurrency } from '../../utils/formatCurrency/formatCurrency'
import type { EventFeeTeamsOverview } from '../../services/finance/finance.types'

const EMPTY_OVERVIEW: EventFeeTeamsOverview = {
  paidPercentage: 0,
  exemptPercentage: 0,
  pendingPercentage: 0,
  collectedCents: 0,
  expectedCents: 0,
  currency: 'BRL',
  teams: [],
}

export function EventFeePage() {
  const eventQuery = useCurrentEventQuery()
  const overviewQuery = useEventFeeTeamsOverviewQuery()

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

        {/* Money first: it is the number a treasurer opens this page for, and the
            rates beside it explain how far along the collection is.

            Rates rather than head counts — "Taxa de Pagamento Global" used to sit
            here as a fourth card showing the same number as "Taxas Pagas" now
            does, so the two collapsed into one. The absolute numbers live on the
            by-member page and in the per-team table below. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatusCard
            title="Taxas Pagas"
            value={`${overview.paidPercentage}%`}
            variant="success"
            description="dos membros das equipes"
          />
          <StatusCard
            title="Isentos"
            value={`${overview.exemptPercentage}%`}
            variant="info"
            description="dispensados do pagamento"
            icon={<FiGift size="24px" />}
          />
          <StatusCard
            title="Taxas Pendentes"
            value={`${overview.pendingPercentage}%`}
            variant="error"
            description="ainda não quitados"
            icon={<FiXCircle size="24px" />}
          />
          <StatusCard
            title="Total Arrecadado"
            value={formatCurrency(overview.collectedCents, overview.currency)}
            variant="success"
            description={`de ${formatCurrency(overview.expectedCents, overview.currency)} previstos`}
          />
        </div>

        <FeeByTeamCard rows={overview.teams} overallPaidPercentage={overview.paidPercentage} />
      </div>
    </div>
  )
}
