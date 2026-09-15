import { useEffect, useMemo, useState } from 'react'
import { FiXCircle } from 'react-icons/fi'
import { EventFeeMembersTable } from '../../components/EventFeeMembersTable/EventFeeMembersTable'
import { FeeBulkSelectionBar } from '../../components/FeeBulkSelectionBar/FeeBulkSelectionBar'
import { FeeConfirmationModal } from '../../components/FeeConfirmationModal/FeeConfirmationModal'
import { FeeStatusReviewModal } from '../../components/FeeStatusReviewModal/FeeStatusReviewModal'
import { Pagination } from '../../components/Pagination/Pagination'
import { SearchInput } from '../../components/SearchInput/SearchInput'
import { Selector, type Option } from '../../components/Selector/Selector'
import { StatusCard } from '../../components/StatusCard/StatusCard'
import {
  removeMemberFromSelection,
  toggleMemberSelection,
} from '../../components/TeamMembersFeeCard/feeMemberSelection'
import { useAuthentication } from '../../hooks/useAuthentication'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { usePagination } from '../../hooks/usePagination'
import { useSetEventFeeStatusMutation } from '../../services/finance/useSetEventFeeStatusMutation'
import { useEventFeeMembersQuery } from '../../services/finance/useEventFeeMembersQuery'
import { useTeamOptionsQuery } from '../../services/teams/useTeamOptionsQuery'
import { EventFeePermissions, hasPermission } from '../../../../common/permissions'
import { toastPromise } from '../../utils/toast/toast'
import type { ReviewableFeeStatus } from '../../components/FeeStatusReviewModal/feeReviewOptions'
import type {
  EventFeeMemberFilters,
  EventFeeMemberStats,
  TeamMemberFeeStatus,
} from '../../services/finance/finance.types'
import { formatSelectedMemberLabels } from '../../components/TeamMembersFeeCard/feeMemberLabels'

const ALL_TEAMS = 'all'
const ALL_STATUSES = 'all'

const EMPTY_STATS: EventFeeMemberStats = {
  totalMembers: 0,
  paidCount: 0,
  pendingCount: 0,
  paidPercentage: 0,
}

/**
 * Labelled for the fold they actually apply, not for the pill they resemble.
 *
 * The filter still asks the API for the two-state standing, while the table now
 * spells out the stored status — so a plain "Pago" would return a page of rows
 * badged "Isento" and read as a bug. Naming both halves is what keeps the
 * result honest without pushing per-status filtering into the API.
 */
const statusOptions: Option[] = [
  { value: ALL_STATUSES, label: 'Todos os status' },
  { value: 'paid', label: 'Pagos e isentos' },
  { value: 'pending', label: 'Pendentes e não pagos' },
]

/**
 * Which members the bulk confirmation dialog is about, or `null` when it is
 * closed.
 *
 * Only the bulk bar feeds it now: a row's action opens the review dialog
 * instead, which is about one person and every status rather than many people
 * and only `paid`. Holding ids rather than a boolean is what lets the dialog
 * name people, and what stops a selection changed behind the dialog from being
 * submitted in place of the one the user saw.
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
  // The row under review, by id rather than by row: the member is looked up in
  // the live `rows` on every render, so a refetch that changes someone's status
  // is reflected in the open dialog instead of leaving it showing a stale one.
  const [reviewUserId, setReviewUserId] = useState<string | null>(null)

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
  const setStatusMutation = useSetEventFeeStatusMutation()

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

  // Resolved from the page on screen, so an id left over from a filter change or
  // a page turn simply closes the dialog rather than reviewing a ghost.
  const memberUnderReview = rows.find((row) => row.userId === reviewUserId) ?? null

  // Forgets an id the list no longer holds. Closing the dialog is already
  // handled by `memberUnderReview` going null, but leaving the id behind means a
  // later refetch that brings the row back — clearing the status filter, say —
  // would pop the dialog open again on its own.
  useEffect(() => {
    if (reviewUserId !== null && memberUnderReview === null) {
      setReviewUserId(null)
    }
  }, [reviewUserId, memberUnderReview])

  const handleConfirm = () => {
    if (!pendingConfirmation) {
      return
    }

    const { userIds } = pendingConfirmation

    toastPromise(setStatusMutation.mutateAsync({ userIds, status: 'paid' }), {
      message: `${userIds.length === 1 ? 'Taxa confirmada' : 'Taxas confirmadas'} com sucesso!`,
      callback: () => setSelectedIds([]),
    })

    setPendingConfirmation(null)
  }

  const handleSaveReview = (status: ReviewableFeeStatus) => {
    if (!memberUnderReview) {
      return
    }

    const { userId } = memberUnderReview

    toastPromise(setStatusMutation.mutateAsync({ userIds: [userId], status }), {
      message: 'Status da taxa atualizado com sucesso!',
    })

    // Pruned rather than left in place: a member reviewed to `exempt` while
    // checked would otherwise still be in the bulk bar, whose one action writes
    // `paid` straight over the exemption — and their row no longer renders a
    // checkbox to untick.
    setSelectedIds((current) => removeMemberFromSelection(current, userId))
    setReviewUserId(null)
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
            title="Membros Listados"
            value={stats.totalMembers}
            variant="neutral"
            description="membros e coordenadores das equipes"
          />
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
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="min-w-55 flex-1 lg:max-w-sm lg:flex-none">
            <SearchInput
              fullWidth
              placeholder="Pesquisar por nome"
              value={search}
              onChange={setSearch}
            />
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-3">
            <div className="w-50">
              <Selector
                options={teamOptions}
                selected={teamOptions.find((option) => option.value === teamKey)}
                placeholder="Todas as equipes"
                onChange={(option) => setTeamKey(option.value)}
              />
            </div>
            <div className="w-45">
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
          onReviewMember={setReviewUserId}
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
        isConfirming={setStatusMutation.isPending}
        onClose={() => setPendingConfirmation(null)}
        onConfirm={handleConfirm}
      />

      <FeeStatusReviewModal
        open={memberUnderReview !== null}
        member={memberUnderReview}
        isSaving={setStatusMutation.isPending}
        onClose={() => setReviewUserId(null)}
        onSave={handleSaveReview}
      />
    </div>
  )
}
