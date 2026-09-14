import { useMemo, useState } from 'react'
import { FiXCircle } from 'react-icons/fi'
import { FeeBulkSelectionBar } from '../../components/FeeBulkSelectionBar/FeeBulkSelectionBar'
import { FeeConfirmationModal } from '../../components/FeeConfirmationModal/FeeConfirmationModal'
import { StatusCard } from '../../components/StatusCard/StatusCard'
import { TeamMembersFeeCard } from '../../components/TeamMembersFeeCard/TeamMembersFeeCard'
import { formatSelectedMemberLabels } from '../../components/TeamMembersFeeCard/feeMemberLabels'
import { getMemberFeeCounts } from '../../components/TeamMembersFeeCard/feeMemberStats'
import {
  toggleMemberSelection,
  toggleSelectAllPending,
} from '../../components/TeamMembersFeeCard/feeMemberSelection'
import { useCurrentEventSubscriptionStatusQuery } from '../../services/events/useCurrentEventSubscriptionStatusQuery'
import { useConfirmTeamFeesMutation } from '../../services/finance/useConfirmTeamFeesMutation'
import { useMyTeamQuery } from '../../services/teams/useMyTeamQuery'
import { toastPromise } from '../../utils/toast/toast'
import { mapTeamDetailToFeeRows } from './mapTeamDetailToFeeRows'

/**
 * Which members the confirmation dialog is about, or `null` when it is closed.
 * Same shape and same reasoning as the treasurer's page: a row's "Confirmar" is
 * a selection of one, the bulk bar's is a selection of many, and holding ids
 * rather than a boolean is what lets the dialog name people.
 */
type PendingConfirmation = { userIds: string[] } | null

/**
 * A coordinator's view of their own team's event fees.
 *
 * Reads the roster from the team endpoint rather than a finance one: that
 * response already carries each person's fee standing, and it is self-scoped —
 * it takes no team parameter, so there is no team a coordinator could ask for
 * but their own.
 *
 * The coordinator check here is what makes the page coordinator-only for anyone
 * who types the URL; the sidebar entry is only the discoverable half of it. It
 * is still not the authorization boundary — the API re-derives the caller's
 * membership on every confirmation and answers 403 for anyone else.
 */
export function CoordinatorEventFeePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation>(null)

  const subscriptionStatus = useCurrentEventSubscriptionStatusQuery()
  const teamQuery = useMyTeamQuery()
  const confirmMutation = useConfirmTeamFeesMutation()

  const team = teamQuery.data
  const rows = useMemo(() => mapTeamDetailToFeeRows(team), [team])
  const counts = getMemberFeeCounts(rows)

  const isCoordinator = subscriptionStatus.data?.myMembershipType === 'coordinator'

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

  // Both queries are awaited before deciding anything: resolving the membership
  // alone would render the page's empty state for a coordinator whose roster is
  // still in flight, and resolving neither would flash "not a coordinator" at
  // the one person the page is for.
  if (subscriptionStatus.isLoading || teamQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando taxas da equipe...</div>
      </div>
    )
  }

  if (subscriptionStatus.error || teamQuery.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Não foi possível carregar as taxas da sua equipe.</div>
      </div>
    )
  }

  // After the error branch: a failed status request leaves `myMembershipType`
  // undefined, which read as a verdict would tell a coordinator the page is not
  // for them when all that happened was a dropped request.
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

  return (
    // Bottom padding leaves room for the viewport-fixed bulk bar, which cannot
    // reserve space for itself.
    <div className="min-h-screen px-4 py-6 pb-28 sm:px-6 lg:px-8">
      <div className="max-w-8xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 m-0">Taxa de Inscrição</h1>
          <p className="mt-2 text-gray-600">
            Pagamentos da equipe <strong className="font-semibold">{team?.name}</strong> para o{' '}
            <strong className="font-semibold">{subscriptionStatus.data?.eventName}</strong>.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatusCard
            title="Total de Membros na Equipe"
            value={counts.total}
            variant="neutral"
            description="coordenadores + membros"
          />
          <StatusCard
            title="Taxas Pagas"
            value={counts.paid}
            variant="success"
            description={`${counts.paidPercentage}% do total`}
          />
          <StatusCard
            title="Taxas Pendentes"
            value={counts.pending}
            variant="error"
            description={`${100 - counts.paidPercentage}% do total`}
            icon={<FiXCircle size="24px" />}
          />
          <StatusCard
            title="Taxa de Pagamento"
            value={`${counts.paidPercentage}%`}
            variant="info"
            description={`${counts.paid} de ${counts.total} membros`}
          />
        </div>

        <TeamMembersFeeCard
          rows={rows}
          selectedIds={selectedIds}
          onToggleMember={(memberId) =>
            setSelectedIds((current) => toggleMemberSelection(current, memberId))
          }
          onToggleSelectAllPending={() =>
            setSelectedIds((current) => toggleSelectAllPending(rows, current))
          }
          onConfirmMember={(memberId) => setPendingConfirmation({ userIds: [memberId] })}
        />
      </div>

      {/* Mounted unconditionally: the bar renders nothing at zero selected. */}
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
