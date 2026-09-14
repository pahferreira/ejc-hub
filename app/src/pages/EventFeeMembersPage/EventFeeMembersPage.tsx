import { useEffect, useMemo, useState } from 'react'
import { FiXCircle } from 'react-icons/fi'
import { EventFeeMembersTable } from '../../components/EventFeeMembersTable/EventFeeMembersTable'
import { FeeBulkSelectionBar } from '../../components/FeeBulkSelectionBar/FeeBulkSelectionBar'
import { FeeConfirmationModal } from '../../components/FeeConfirmationModal/FeeConfirmationModal'
import { Pagination } from '../../components/Pagination/Pagination'
import { SearchInput } from '../../components/SearchInput/SearchInput'
import { Selector, type Option } from '../../components/Selector/Selector'
import { StatusCard } from '../../components/StatusCard/StatusCard'
import { formatSelectedMemberLabels } from '../../components/TeamMembersFeeCard/feeMemberLabels'
import { toggleMemberSelection } from '../../components/TeamMembersFeeCard/feeMemberSelection'
import { useAuthentication } from '../../hooks/useAuthentication'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { usePagination } from '../../hooks/usePagination'
import { useConfirmEventFeesMutation } from '../../services/finance/useConfirmEventFeesMutation'
import { useEventFeeMembersQuery } from '../../services/finance/useEventFeeMembersQuery'
import { useTeamOptionsQuery } from '../../services/teams/useTeamOptionsQuery'
import { EventFeePermissions, hasPermission } from '../../../../common/permissions'
import { toastPromise } from '../../utils/toast/toast'
import type {
  EventFeeMemberFilters,
  EventFeeMemberStats,
  TeamMemberFeeStatus,
} from '../../services/finance/finance.types'

const ALL_TEAMS = 'all'
const ALL_STATUSES = 'all'

const EMPTY_STATS: EventFeeMemberStats = {
  totalMembers: 0,
  paidCount: 0,
  pendingCount: 0,
  paidPercentage: 0,
}

const statusOptions: Option[] = [
  { value: ALL_STATUSES, label: 'Todos os status' },
  { value: 'paid', label: 'Pago' },
  { value: 'pending', label: 'Pendente' },
]

/**
 * Which members the confirmation dialog is about, or `null` when it is closed.
 *
 * One piece of state for both entry points: a row's "Confirmar" is a selection
 * of one, and the bulk bar's is a selection of many. Holding ids rather than a
 * boolean is what lets the dialog name people, and what stops a stale bulk
 * selection from being submitted after the row action opened the dialog.
 */
type PendingConfirmation = { userIds: string[] } | null

export function EventFeeMembersPage() {
  const { permissions } = useAuthentication()
  const canConfirm = hasPermission(permissions, EventFeePermissions.Update)

  const [search, setSearch] = useState('')
  const [teamKey, setTeamKey] = useState(ALL_TEAMS)
  const [status, setStatus] = useState<TeamMemberFeeStatus | typeof ALL_STATUSES>(ALL_STATUSES)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation>(null)

  const debouncedSearch = useDebouncedValue(search, 300)
  const { page, pageSize, nextPage, prevPage, resetPage } = usePagination()

  const filters: EventFeeMemberFilters = useMemo(
    () => ({
      ...(debouncedSearch ? { name: debouncedSearch } : {}),
      ...(teamKey !== ALL_TEAMS ? { teamKey } : {}),
      ...(status !== ALL_STATUSES ? { status } : {}),
    }),
    [debouncedSearch, teamKey, status]
  )

  // A narrowed result no longer contains the rows that were selected, and the
  // bulk bar must never offer to confirm people the user can no longer see.
  useEffect(() => {
    resetPage()
    setSelectedIds([])
  }, [filters, resetPage])

  useEffect(() => {
    setSelectedIds([])
  }, [page])

  const membersQuery = useEventFeeMembersQuery(filters, { page, pageSize })
  const teamOptionsQuery = useTeamOptionsQuery()
  const confirmMutation = useConfirmEventFeesMutation()

  const teamOptions: Option[] = useMemo(
    () => [
      { value: ALL_TEAMS, label: 'Todas as equipes' },
      ...(teamOptionsQuery.data ?? []).map((team) => ({ value: team.key, label: team.name })),
    ],
    [teamOptionsQuery.data]
  )

  const rows = membersQuery.data?.items ?? []
  const stats = membersQuery.data?.stats ?? EMPTY_STATS
  const total = membersQuery.data?.total ?? 0

  const confirmationNames = pendingConfirmation
    ? formatSelectedMemberLabels(rows, pendingConfirmation.userIds)
    : []

  const handleConfirm = () => {
    if (!pendingConfirmation) {
      return
    }

    const { userIds } = pendingConfirmation

    toastPromise(confirmMutation.mutateAsync(userIds), {
      message: `${userIds.length === 1 ? 'Taxa confirmada' : 'Taxas confirmadas'} com sucesso!`,
      callback: () => setSelectedIds([]),
    })

    setPendingConfirmation(null)
  }

  if (membersQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando taxas por membro...</div>
      </div>
    )
  }

  if (membersQuery.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Error: {membersQuery.error.message}</div>
      </div>
    )
  }

  return (
    // Bottom padding leaves room for the viewport-fixed bulk bar, which cannot
    // reserve space for itself.
    <div className="min-h-screen px-4 py-6 pb-28 sm:px-6 lg:px-8">
      <div className="max-w-8xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 m-0">Taxa por Membro</h1>
          <p className="mt-2 text-gray-600">Todos os encontreiros designados a uma equipe.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatusCard
            title="Taxas Pagas"
            value={stats.paidCount}
            variant="success"
            description={`${stats.paidPercentage}% dos membros listados`}
          />
          <StatusCard
            title="Pendentes"
            value={stats.pendingCount}
            variant="error"
            description={`${100 - stats.paidPercentage}% dos membros listados`}
            icon={<FiXCircle size="24px" />}
          />
          <StatusCard
            title="Taxa de Pagamento"
            value={`${stats.paidPercentage}%`}
            variant="info"
            description={`${stats.paidCount} de ${stats.totalMembers} membros`}
          />
          <StatusCard
            title="Membros Listados"
            value={stats.totalMembers}
            variant="neutral"
            description="membros e coordenadores das equipes"
          />
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="min-w-[220px] flex-1 lg:max-w-sm lg:flex-none">
            <SearchInput
              fullWidth
              placeholder="Pesquisar por nome"
              value={search}
              onChange={setSearch}
            />
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-3">
            <div className="w-[200px]">
              <Selector
                options={teamOptions}
                selected={teamOptions.find((option) => option.value === teamKey)}
                placeholder="Todas as equipes"
                onChange={(option) => setTeamKey(option.value)}
              />
            </div>
            <div className="w-[180px]">
              <Selector
                options={statusOptions}
                selected={statusOptions.find((option) => option.value === status)}
                placeholder="Todos os status"
                onChange={(option) =>
                  setStatus(option.value as TeamMemberFeeStatus | typeof ALL_STATUSES)
                }
              />
            </div>
          </div>
        </div>

        <div className="mb-4 flex justify-end">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPrev={prevPage}
            onNext={nextPage}
          />
        </div>

        <EventFeeMembersTable
          rows={rows}
          selectedIds={selectedIds}
          canConfirm={canConfirm}
          onToggleMember={(memberId) =>
            setSelectedIds((current) => toggleMemberSelection(current, memberId))
          }
          onConfirmMember={(memberId) => setPendingConfirmation({ userIds: [memberId] })}
        />
      </div>

      {/* Mounted unconditionally: the bar renders nothing at zero selected, and
          a viewer who cannot confirm never accumulates a selection. */}
      <FeeBulkSelectionBar
        selectedCount={selectedIds.length}
        onCancel={() => setSelectedIds([])}
        onConfirm={() => setPendingConfirmation({ userIds: selectedIds })}
      />

      <FeeConfirmationModal
        open={pendingConfirmation !== null}
        memberNames={confirmationNames}
        isConfirming={confirmMutation.isPending}
        onClose={() => setPendingConfirmation(null)}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
