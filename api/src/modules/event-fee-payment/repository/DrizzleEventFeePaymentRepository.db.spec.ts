import { describe, it, expect } from 'vitest'
import { eq } from 'drizzle-orm'
import { db } from '../../../core/database/client.ts'
import { schema } from '../../../core/database/schemas/index.ts'
import { SETTABLE_FEE_STATUSES } from '../domain/fee-payment-status.ts'
import type { SettableFeeStatus } from '../domain/fee-payment-status.ts'
import { eventFeePaymentRepository } from './DrizzleEventFeePaymentRepository.ts'

type StoredStatus = (typeof schema.eventFeePayments.$inferSelect)['status']

const FEE = 6_000
const NEW_FEE = 7_500
const OLD_FEE = 5_000

async function insertEventAndMember() {
  const [event] = await db
    .insert(schema.events)
    .values({ name: 'EJC', description: 'Encontro', feeAmountCents: FEE })
    .returning()
  const [member, treasurer] = await db
    .insert(schema.users)
    .values([
      { authId: 'auth|member', email: 'member@example.com', name: 'Member' },
      { authId: 'auth|treasurer', email: 'treasurer@example.com', name: 'Treasurer' },
    ])
    .returning()

  return { eventId: event.id, memberId: member.id, treasurerId: treasurer.id }
}

async function insertPayment(
  ids: { eventId: string; memberId: string },
  status: StoredStatus,
  amountCents: number
) {
  await db.insert(schema.eventFeePayments).values({
    eventId: ids.eventId,
    userId: ids.memberId,
    status,
    amountCents,
    paidAt: status === 'paid' ? new Date() : null,
  })
}

async function setStatus(
  ids: { eventId: string; memberId: string; treasurerId: string },
  status: SettableFeeStatus,
  amountCents: number
) {
  await eventFeePaymentRepository.setPaymentsStatus({
    eventId: ids.eventId,
    userIds: [ids.memberId],
    status,
    recordedBy: ids.treasurerId,
    amountCents,
  })
}

async function storedPayment(memberId: string) {
  const rows = await db
    .select()
    .from(schema.eventFeePayments)
    .where(eq(schema.eventFeePayments.userId, memberId))

  expect(rows).toHaveLength(1)
  return rows[0]
}

describe('DrizzleEventFeePaymentRepository.setPaymentsStatus (real Postgres)', () => {
  describe('moving into paid', () => {
    it('stamps the fee it is given on a member with no payment row', async () => {
      const ids = await insertEventAndMember()

      await setStatus(ids, 'paid', FEE)

      const payment = await storedPayment(ids.memberId)
      expect(payment).toMatchObject({
        status: 'paid',
        amountCents: FEE,
        recordedBy: ids.treasurerId,
      })
      expect(payment.paidAt).toBeInstanceOf(Date)
    })

    it.each<StoredStatus>(['pending', 'not_paid', 'exempt', 'refunded'])(
      'stamps the current fee over the stale amount of a %s row',
      async (from) => {
        const ids = await insertEventAndMember()
        await insertPayment(ids, from, OLD_FEE)

        await setStatus(ids, 'paid', NEW_FEE)

        expect(await storedPayment(ids.memberId)).toMatchObject({
          status: 'paid',
          amountCents: NEW_FEE,
        })
      }
    )

    it('stamps the fee even when the stored amount is 0', async () => {
      const ids = await insertEventAndMember()
      await insertPayment(ids, 'pending', 0)

      await setStatus(ids, 'paid', FEE)

      expect((await storedPayment(ids.memberId)).amountCents).toBe(FEE)
    })

    it('keeps what a paid member paid when they are confirmed again after a fee change', async () => {
      const ids = await insertEventAndMember()
      await insertPayment(ids, 'paid', OLD_FEE)

      await setStatus(ids, 'paid', NEW_FEE)

      expect(await storedPayment(ids.memberId)).toMatchObject({
        status: 'paid',
        amountCents: OLD_FEE,
      })
    })
  })

  describe('moving out of paid', () => {
    it.each(SETTABLE_FEE_STATUSES.filter((status) => status !== 'paid'))(
      'keeps the amount that was paid when moving to %s',
      async (to) => {
        const ids = await insertEventAndMember()
        await insertPayment(ids, 'paid', OLD_FEE)

        await setStatus(ids, to, NEW_FEE)

        expect(await storedPayment(ids.memberId)).toMatchObject({
          status: to,
          amountCents: OLD_FEE,
          paidAt: null,
          method: null,
        })
      }
    )
  })

  it.each(SETTABLE_FEE_STATUSES.filter((status) => status !== 'paid'))(
    'writes the current fee on a %s row it creates',
    async (status) => {
      const ids = await insertEventAndMember()

      await setStatus(ids, status, FEE)

      expect(await storedPayment(ids.memberId)).toMatchObject({ status, amountCents: FEE })
    }
  )
})
