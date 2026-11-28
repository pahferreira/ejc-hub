import { describe, it, expect, vi } from 'vitest'

// The api has no test database, so the module-level client is stubbed out and
// every write below goes through a fake executor that records the upsert.
vi.mock('../../../core/database/client.ts', () => ({ db: {} }))

import { PgDialect } from 'drizzle-orm/pg-core'
import type { SQL } from 'drizzle-orm'
import type { DbExecutor } from '../../../core/database/client.ts'
import { SETTABLE_FEE_STATUSES } from '../domain/fee-payment-status.ts'
import type { SettableFeeStatus } from '../domain/fee-payment-status.ts'
import { eventFeePaymentRepository } from './DrizzleEventFeePaymentRepository.ts'

type RecordedUpsert = {
  values: Record<string, unknown>[]
  set: Record<string, unknown>
}

// Records what the repository asks the database to do instead of running it.
// That proves which fields an upsert writes, but not how Postgres evaluates the
// `case` expression: that part is only covered by reading the rendered SQL.
function makeRecordingExecutor() {
  const recorded: RecordedUpsert = { values: [], set: {} }

  const executor = {
    insert: () => ({
      values: (values: Record<string, unknown>[]) => {
        recorded.values = values

        return {
          onConflictDoUpdate: ({ set }: { set: Record<string, unknown> }) => {
            recorded.set = set

            return {
              returning: () =>
                Promise.resolve(values.map((value) => ({ userId: value.userId as string }))),
            }
          },
        }
      },
    }),
  } as unknown as DbExecutor

  return { executor, recorded }
}

async function setStatus(status: SettableFeeStatus, amountCents = 6_000) {
  const { executor, recorded } = makeRecordingExecutor()

  await eventFeePaymentRepository.setPaymentsStatus({
    eventId: 'event-1',
    userIds: ['user-a'],
    status,
    recordedBy: 'actor-id',
    amountCents,
    executor,
  })

  return recorded
}

function render(fragment: unknown) {
  return new PgDialect().sqlToQuery(fragment as SQL).sql
}

describe('DrizzleEventFeePaymentRepository.setPaymentsStatus', () => {
  describe('moving into paid', () => {
    it('stamps the current fee on a row that was not paid yet', async () => {
      const { set } = await setStatus('paid')

      // pending / not_paid / exempt / refunded all take the `else` branch.
      expect(render(set.amountCents)).toBe(
        `case when "event_fee_payments"."status" = 'paid' then "event_fee_payments"."amount_cents" else excluded.amount_cents end`
      )
    })

    it('stamps the fee it was given, not one it remembers', async () => {
      const { values } = await setStatus('paid', 7_500)

      // `excluded.amount_cents` is this value, so a fee change reaches the
      // next member marked paid with no repricing step in between.
      expect(values[0].amountCents).toBe(7_500)
    })

    it('keeps the amount of a row that is already paid', async () => {
      const { set } = await setStatus('paid')

      expect(render(set.amountCents)).toContain(
        `when "event_fee_payments"."status" = 'paid' then "event_fee_payments"."amount_cents"`
      )
    })

    it('no longer reprices a row because its amount is 0', async () => {
      const { set } = await setStatus('paid')

      expect(render(set.amountCents)).not.toContain('= 0')
    })
  })

  it.each(SETTABLE_FEE_STATUSES.filter((status) => status !== 'paid'))(
    'keeps the stored amount when moving to %s',
    async (status) => {
      const { set } = await setStatus(status)

      // Absent from the update, so whatever the row holds (including what a
      // paid member paid before a correction) stays as it is.
      expect(set).not.toHaveProperty('amountCents')
    }
  )

  it('writes the current fee on a row it creates', async () => {
    const { values } = await setStatus('pending', 6_000)

    expect(values[0].amountCents).toBe(6_000)
  })
})
