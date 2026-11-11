import type { MemberFeeStatusRow } from '../../../modules/event-fee-payment/domain/EventFeePaymentRepository.ts'
import {
  toMemberFeeStanding,
  toSettableFeeStatus,
} from '../../../modules/event-fee-payment/domain/fee-payment-status.ts'
import { resolveNickname } from '../../../shared/resolve-nickname.ts'
import type { EventFeeMemberRow } from '../domain/event-fee.types.ts'

// The repository speaks in stored columns; the page speaks in people. This is
// the one place the two are reconciled, so a new consumer of the member list
// cannot invent its own nickname fallback or its own idea of "paid".
export function toMemberRow(row: MemberFeeStatusRow): EventFeeMemberRow {
  return {
    userId: row.userId,
    name: row.name,
    nickname: resolveNickname(row.name, row.nickname),
    phone: row.phone,
    pictureUrl: row.pictureUrl,
    experienceType: row.experienceType,
    circleKey: row.circleKey,
    membershipType: row.membershipType,
    teamId: row.teamId,
    teamKey: row.teamKey,
    teamName: row.teamName,
    status: toMemberFeeStanding(row.feeStatus),
    // Both readings of the same column: the fold the list acts on, and the
    // stored status the review dialog preselects.
    paymentStatus: toSettableFeeStatus(row.feeStatus),
  }
}
