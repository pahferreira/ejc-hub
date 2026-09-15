import type { TeamMemberFeeRow } from '../../services/finance/finance.types'

/**
 * Only pending members can be selected: a paid fee has nothing left to confirm,
 * so its row renders a static marker instead of a checkbox. Every function here
 * upholds that rule, which is why "select all" is defined over pending ids
 * rather than over all rows.
 *
 * All functions return new arrays and never mutate their input, so the owner of
 * the selection can hold it in `useState` and replace it wholesale.
 */
export function getPendingMemberIds(rows: TeamMemberFeeRow[]): string[] {
  return rows.filter((row) => row.status === 'pending').map((row) => row.userId)
}

/**
 * False when the team has no pending members at all. `every` on an empty list is
 * vacuously true, which would leave the "Selecionar pendentes" toggle looking
 * checked for a fully-settled team that has nothing to select.
 */
export function isAllPendingSelected(rows: TeamMemberFeeRow[], selectedIds: string[]): boolean {
  const pendingIds = getPendingMemberIds(rows)

  if (pendingIds.length === 0) {
    return false
  }

  return pendingIds.every((id) => selectedIds.includes(id))
}

/**
 * Selects every pending member, or clears the selection when they are already
 * all selected. Clearing returns an empty array rather than subtracting the
 * pending ids, because nothing else can legally be in the selection.
 */
export function toggleSelectAllPending(rows: TeamMemberFeeRow[], selectedIds: string[]): string[] {
  return isAllPendingSelected(rows, selectedIds) ? [] : getPendingMemberIds(rows)
}

export function toggleMemberSelection(selectedIds: string[], memberId: string): string[] {
  return selectedIds.includes(memberId)
    ? selectedIds.filter((id) => id !== memberId)
    : [...selectedIds, memberId]
}

/**
 * Drops one member from the selection, whatever their status.
 *
 * The counterpart to `toggleMemberSelection` for actions that happen *outside*
 * the checkbox. The treasurer's review dialog is the case: reviewing a checked
 * member to `exempt` leaves their id in a bulk bar that writes `paid`, which
 * would quietly overwrite the exemption that was just granted. The row stops
 * rendering a checkbox once it is settled, so there is no way to untick it
 * either — the selection has to be pruned here.
 *
 * Idempotent, and cheap enough to call for a member who was never selected.
 */
export function removeMemberFromSelection(selectedIds: string[], memberId: string): string[] {
  return selectedIds.filter((id) => id !== memberId)
}
