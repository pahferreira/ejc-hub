import { useEffect, useMemo, useState } from 'react'
import { FiAlertCircle, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi'
import { ApproveRequestModal } from '../../components/ApproveRequestModal/ApproveRequestModal'
import { DashboardSection } from '../../components/DashboardSection/DashboardSection'
import { DenyRequestModal } from '../../components/DenyRequestModal/DenyRequestModal'
import { MemberRequestsTable } from '../../components/MemberRequestsTable/MemberRequestsTable'
import { Pagination } from '../../components/Pagination/Pagination'
import { SearchInput } from '../../components/SearchInput/SearchInput'
import { Selector, type Option } from '../../components/Selector/Selector'
import { SubscriptionSummaryBox } from '../../components/SubscriptionSummaryBox/SubscriptionSummaryBox'
import { useAuthentication } from '../../hooks/useAuthentication'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { usePagination } from '../../hooks/usePagination'
import { useMemberRequestQueueQuery } from '../../services/member-requests/useMemberRequestQueueQuery'
import { useResolveMemberRequestMutation } from '../../services/member-requests/useResolveMemberRequestMutation'
import { useTeamOptionsQuery } from '../../services/teams/useTeamOptionsQuery'
import { hasAnyPermission, MemberRequestPermissions } from '../../../../common/permissions'
import { pluralize } from '../../utils/pluralize/pluralize'
import { toastPromise } from '../../utils/toast/toast'
import type { MemberRequestQueueFilters } from '../../services/member-requests/member-requests.types'

const MEMBER_REQUESTS_PAGE_SIZE = 15
const ALL_TEAMS = 'all'

/**
 * Which card is selected, which is the page's whole status filter.
 *
 * One piece of state, two query params, never both: `disputed` sends
 * `disputed=true` with no status, and the other three send a `status` with no
 * `disputed` (plan D10). `null` means no card is selected — the only way to
 * see `outdated` and `cancelled` requests, which no card covers (D13).
 */
type CardFilter = 'pending' | 'disputed' | 'approved' | 'denied' | null

const EMPTY_STATS = {
  pending: 0,
  disputedMembers: 0,
  disputedRequests: 0,
  approved: 0,
  denied: 0,
}

/**
 * Copy for each empty state.
 *
 * Per-filter, because "the pending pile is clear" is good news and "your
 * filters match nothing" is not, and one string cannot be both (plan H.8).
 */
function emptyMessageFor(cardFilter: CardFilter, hasOtherFilters: boolean): string {
  if (cardFilter === 'pending') {
    return 'Nenhuma solicitação pendente. Tudo em dia.'
  }

  if (cardFilter === 'disputed') {
    return 'Nenhum membro com mais de uma solicitação.'
  }

  if (cardFilter === 'approved') {
    return 'Nenhuma solicitação aprovada ainda.'
  }

  if (cardFilter === 'denied') {
    return 'Nenhuma solicitação negada.'
  }

  return hasOtherFilters
    ? 'Nenhuma solicitação encontrada com os filtros atuais.'
    : 'Nenhuma solicitação foi feita ainda.'
}

/**
 * "Solicitações de Membros": the admin queue, where coordinator requests are
 * approved or denied one at a time.
 *
 * The H1 and the sidebar label differ on purpose — `Aprovar Solicitações` in
 * the nav, because an admin who also coordinates would otherwise see
 * "Solicitar Membros" and "Solicitações de Membros" one letter apart (plan D7).
 *
 * Structurally `EventSubscriptionsList` for the clickable cards and
 * `EventFeeMembersPage` for the filter row and server paging.
 */
export function MemberRequestsQueuePage() {
  // Pending on mount: this is a work queue, and the pending pile is the work.
  const [cardFilter, setCardFilter] = useState<CardFilter>('pending')
  const [search, setSearch] = useState('')
  const [teamKey, setTeamKey] = useState(ALL_TEAMS)
  // Both dialogs hold their subject by id and look it up in the live rows, so a
  // refetch that resolves the request elsewhere closes the dialog instead of
  // submitting against a row that no longer exists.
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [denyingId, setDenyingId] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(search, 300)
  const { page, pageSize, nextPage, prevPage, resetPage } = usePagination(MEMBER_REQUESTS_PAGE_SIZE)

  const filters: MemberRequestQueueFilters = useMemo(
    () => ({
      ...(cardFilter === 'disputed' ? { disputed: true } : {}),
      ...(cardFilter && cardFilter !== 'disputed' ? { status: cardFilter } : {}),
      ...(debouncedSearch ? { name: debouncedSearch } : {}),
      ...(teamKey !== ALL_TEAMS ? { teamKey } : {}),
    }),
    [cardFilter, debouncedSearch, teamKey]
  )

  useEffect(() => {
    resetPage()
  }, [filters, resetPage])

  const { permissions } = useAuthentication()
  // `hasAnyPermission`, not `hasPermission`: route #6 is `mode: 'any'`, so
  // gating on `Update` alone would hide the buttons from a `Create`-only admin
  // the API would have accepted (plan H.7). Every other page in this app uses
  // `hasPermission` — this is not a slip.
  const canResolve = hasAnyPermission(permissions, [
    MemberRequestPermissions.Create,
    MemberRequestPermissions.Update,
  ])

  const queueQuery = useMemberRequestQueueQuery(filters, { page, pageSize })
  const teamOptionsQuery = useTeamOptionsQuery()
  const resolveMutation = useResolveMemberRequestMutation()

  const teamOptions: Option[] = useMemo(
    () => [
      { value: ALL_TEAMS, label: 'Todas as equipes' },
      ...(teamOptionsQuery.data ?? []).map((team) => ({ value: team.key, label: team.name })),
    ],
    [teamOptionsQuery.data]
  )

  const rows = queueQuery.data?.items ?? []
  const total = queueQuery.data?.total ?? 0
  const stats = queueQuery.data?.stats ?? EMPTY_STATS

  const approvingRequest = rows.find((row) => row.id === approvingId) ?? null
  const denyingRequest = rows.find((row) => row.id === denyingId) ?? null

  // An id left over from a page turn, a filter change, or someone else's
  // decision simply closes the dialog rather than acting on a ghost.
  useEffect(() => {
    if (approvingId !== null && approvingRequest === null) {
      setApprovingId(null)
    }
  }, [approvingId, approvingRequest])

  useEffect(() => {
    if (denyingId !== null && denyingRequest === null) {
      setDenyingId(null)
    }
  }, [denyingId, denyingRequest])

  const toggleCardFilter = (next: NonNullable<CardFilter>) => {
    setCardFilter((current) => (current === next ? null : next))
  }

  const handleApprove = () => {
    if (!approvingRequest) {
      return
    }

    // Counted from the row the admin just confirmed against, not from the
    // response: this is what they were shown and agreed to. The API's own
    // `supersededRequestIds` is authoritative for the data and the refetch
    // reflects it, but the toast should report the decision as it was made.
    const supersededCount = approvingRequest.otherPendingRequests.length
    const closedNote =
      supersededCount > 0
        ? ` ${supersededCount} ${pluralize(supersededCount, 'outra foi encerrada', 'outras foram encerradas')}.`
        : ''

    toastPromise(
      resolveMutation.mutateAsync({ requestId: approvingRequest.id, status: 'approved' }),
      { message: `Solicitação aprovada.${closedNote}` }
    )

    setApprovingId(null)
  }

  const handleDeny = (resolutionReason: string) => {
    if (!denyingRequest) {
      return
    }

    toastPromise(
      resolveMutation.mutateAsync({
        requestId: denyingRequest.id,
        status: 'denied',
        resolutionReason,
      }),
      { message: 'Solicitação negada.' }
    )

    setDenyingId(null)
  }

  if (queueQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando solicitações...</div>
      </div>
    )
  }

  if (queueQuery.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Não foi possível carregar as solicitações.</div>
      </div>
    )
  }

  const hasOtherFilters = Boolean(debouncedSearch) || teamKey !== ALL_TEAMS

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-8xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 m-0">Solicitações de Membros</h1>
          <p className="mt-2 text-gray-600">
            Pedidos de coordenadores para trazer alguém da lista de espera para a equipe.
          </p>
        </header>

        {/* The `variant` names are subscription vocabulary on a request screen
            — `waitlist` is the amber tint and `pending` the red one. Left as
            they are: renaming them to tone names would touch
            `EventSubscriptionsList` for cosmetics (plan H.3). */}
        <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-2 xl:grid-cols-4">
          <SubscriptionSummaryBox
            title="Pendentes"
            value={stats.pending}
            variant="waitlist"
            icon={<FiClock size="20px" />}
            active={cardFilter === 'pending'}
            onClick={() => toggleCardFilter('pending')}
          />
          <SubscriptionSummaryBox
            title="Membros disputados"
            value={stats.disputedMembers}
            variant="pending"
            icon={<FiAlertCircle size="20px" />}
            // The one card counting people rather than requests. The caption
            // spells the mismatch out instead of hiding it: a card reading 2
            // opens a table reading "1-5 de 5" (plan D10). Not in the mock —
            // do not remove it to match. Both numbers come from `stats`, never
            // from the table's `total`, so the caption describes the event
            // rather than whatever is currently filtered.
            description={`${stats.disputedMembers} ${pluralize(stats.disputedMembers, 'membro', 'membros')} · ${stats.disputedRequests} ${pluralize(stats.disputedRequests, 'solicitação', 'solicitações')}`}
            active={cardFilter === 'disputed'}
            onClick={() => toggleCardFilter('disputed')}
          />
          <SubscriptionSummaryBox
            title="Aprovadas"
            value={stats.approved}
            variant="completed"
            icon={<FiCheckCircle size="20px" />}
            active={cardFilter === 'approved'}
            onClick={() => toggleCardFilter('approved')}
          />
          <SubscriptionSummaryBox
            title="Negadas"
            value={stats.denied}
            variant="cancelled"
            icon={<FiXCircle size="20px" />}
            active={cardFilter === 'denied'}
            onClick={() => toggleCardFilter('denied')}
          />
        </div>

        <DashboardSection>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="min-w-55 flex-1 lg:max-w-sm lg:flex-none">
              <SearchInput
                fullWidth
                placeholder="Pesquisar por membro ou solicitante"
                value={search}
                onChange={setSearch}
              />
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-3">
              <div className="w-52">
                <Selector
                  options={teamOptions}
                  selected={teamOptions.find((option) => option.value === teamKey)}
                  onChange={(option) => setTeamKey(option.value)}
                  placeholder="Todas as equipes"
                />
              </div>
              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPrev={prevPage}
                onNext={nextPage}
              />
            </div>
          </div>

          <MemberRequestsTable
            rows={rows}
            canResolve={canResolve}
            onApprove={(row) => setApprovingId(row.id)}
            onDeny={(row) => setDenyingId(row.id)}
            emptyMessage={emptyMessageFor(cardFilter, hasOtherFilters)}
          />
        </DashboardSection>
      </div>

      <ApproveRequestModal
        open={approvingRequest !== null}
        request={approvingRequest}
        isSaving={resolveMutation.isPending}
        onClose={() => setApprovingId(null)}
        onSubmit={handleApprove}
      />

      <DenyRequestModal
        open={denyingRequest !== null}
        request={denyingRequest}
        isSaving={resolveMutation.isPending}
        onClose={() => setDenyingId(null)}
        onSubmit={handleDeny}
      />
    </div>
  )
}
