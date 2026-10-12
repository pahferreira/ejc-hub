import { useMemo, useState } from 'react'
import { MyTeamRequestsList } from '../../components/MyTeamRequestsList/MyTeamRequestsList'
import { SearchInput } from '../../components/SearchInput/SearchInput'
import { StatusCard } from '../../components/StatusCard/StatusCard'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useCurrentEventSubscriptionStatusQuery } from '../../services/events/useCurrentEventSubscriptionStatusQuery'
import { useMyTeamRequestsQuery } from '../../services/member-requests/useMyTeamRequestsQuery'
import type { MyTeamRequestFilters } from '../../services/member-requests/member-requests.types'

/**
 * Which card is selected, which is the page's whole status filter.
 *
 * `null` means no card is selected — the only way to see `cancelled` and
 * `outdated` requests, which no card covers (plan I.7). Only three values,
 * unlike the admin queue's `disputed` axis: there is no equivalent concept on
 * a coordinator's own list.
 */
type CardFilter = 'pending' | 'approved' | 'denied' | null

const EMPTY_STATS = { pending: 0, approved: 0, denied: 0 }

/**
 * "Minhas Solicitações": every request the coordinator's team has ever filed,
 * with the admin's answer where there is one.
 *
 * What makes the admin deny modal's mandatory `resolutionReason` visible —
 * before this page, that text was stored and shown on no coordinator-facing
 * screen.
 *
 * The coordinator check and its branch order are `RequestMembersPage`'s,
 * verbatim: the error branch stays above the coordinator one so a dropped
 * request is never read as a verdict, and `useMyTeamRequestsQuery` is gated on
 * `isCoordinator` so the route's own 403 cannot race into the generic
 * "could not load" branch.
 */
export function MyTeamRequestsPage() {
  const [search, setSearch] = useState('')
  const [cardFilter, setCardFilter] = useState<CardFilter>(null)

  const debouncedSearch = useDebouncedValue(search, 300)

  const filters: MyTeamRequestFilters = useMemo(
    () => ({
      ...(cardFilter ? { status: cardFilter } : {}),
      ...(debouncedSearch ? { name: debouncedSearch } : {}),
    }),
    [cardFilter, debouncedSearch]
  )

  const subscriptionStatus = useCurrentEventSubscriptionStatusQuery()
  const isCoordinator = subscriptionStatus.data?.myMembershipType === 'coordinator'

  const myTeamRequestsQuery = useMyTeamRequestsQuery(filters, { enabled: isCoordinator })

  const rows = myTeamRequestsQuery.data?.items ?? []
  const stats = myTeamRequestsQuery.data?.stats ?? EMPTY_STATS

  const toggleCardFilter = (next: NonNullable<CardFilter>) => {
    setCardFilter((current) => (current === next ? null : next))
  }

  if (subscriptionStatus.isLoading || myTeamRequestsQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando solicitações...</div>
      </div>
    )
  }

  if (subscriptionStatus.error || myTeamRequestsQuery.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Não foi possível carregar as solicitações da sua equipe.</div>
      </div>
    )
  }

  // After the error branch: a dropped status request leaves `myMembershipType`
  // undefined, which read as a verdict would tell a coordinator the page is
  // not for them when all that happened was a failed fetch.
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

  const hasActiveFilters = Boolean(cardFilter) || Boolean(debouncedSearch)

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-8xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 m-0">Minhas Solicitações</h1>
          <p className="mt-2 text-gray-600">
            Pedidos que a sua equipe já fez e como a administração respondeu.
          </p>
        </header>

        {/* The three cards *are* the filter — StatusCard's existing solid
            tint (`bg-dark-brown` / `bg-green` / `bg-red`), not the mock's
            light tiles (plan I.6). Stats come from the unfiltered set, so
            searching a name must not move these numbers (plan I.2). */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatusCard
            title="Solicitações pendentes"
            value={stats.pending}
            variant="pending"
            active={cardFilter === 'pending'}
            onClick={() => toggleCardFilter('pending')}
          />
          <StatusCard
            title="Solicitações aprovadas"
            value={stats.approved}
            variant="success"
            active={cardFilter === 'approved'}
            onClick={() => toggleCardFilter('approved')}
          />
          <StatusCard
            title="Solicitações negadas"
            value={stats.denied}
            variant="error"
            active={cardFilter === 'denied'}
            onClick={() => toggleCardFilter('denied')}
          />
        </div>

        <div className="mb-4 min-w-55 max-w-sm">
          <SearchInput
            fullWidth
            placeholder="Pesquisar por nome"
            value={search}
            onChange={setSearch}
          />
        </div>

        <MyTeamRequestsList
          rows={rows}
          emptyMessage={
            hasActiveFilters
              ? 'Nenhuma solicitação encontrada com os filtros atuais.'
              : 'Nenhuma solicitação feita ainda.'
          }
        />
      </div>
    </div>
  )
}
