import { pgTable, pgEnum, uuid, integer, text, timestamp, unique, index } from 'drizzle-orm/pg-core'
import { events } from './events.ts'
import { users } from './users.ts'

export const eventFeePaymentStatus = pgEnum('event_fee_payment_status', [
  // Default. A row exists but nothing has been settled yet — including a declared
  // PIX the treasurer hasn't verified.
  'pending',
  // A treasurer actively checked and confirmed this person has not paid. Distinct
  // from 'pending', which only means nothing has been recorded.
  'not_paid',
  'paid',
  // Comped. Deliberately not 'paid' so financial totals stay honest.
  'exempt',
  'refunded',
])

export const eventFeePaymentMethod = pgEnum('event_fee_payment_method', [
  'pix',
  'cash',
  'credit_card',
  'transfer',
  'other',
])

export const eventFeePayments = pgTable(
  'event_fee_payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
      .references(() => events.id)
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    status: eventFeePaymentStatus().notNull().default('pending'),
    // Snapshot of what this person was actually charged. Editing the event's fee
    // later must not rewrite history.
    amountCents: integer('amount_cents').notNull().default(0),
    method: eventFeePaymentMethod(),
    paidAt: timestamp('paid_at'),
    notes: text('notes'),
    // Who recorded it. Nullable: imported or system rows have no human actor.
    recordedBy: uuid('recorded_by').references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    // The fee is paid once per event, regardless of how many teams a person
    // passes through. Also the conflict target that makes "mark as paid"
    // idempotent.
    unique('event_fee_payments_event_id_user_id_unique').on(table.eventId, table.userId),
    // Drives the Financial dashboard's who-paid / who-owes list.
    index('event_fee_payments_event_id_status_idx').on(table.eventId, table.status),
  ]
)
