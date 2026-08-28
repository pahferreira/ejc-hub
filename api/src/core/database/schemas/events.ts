import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  location: text('location'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
  isCurrent: boolean('is_current').default(false),
  subscriptionsOpen: boolean('subscriptions_open').notNull().default(true),
  // The event's subscription fee, owed by everyone holding a team membership.
  // Integer cents, never numeric — node-postgres returns numeric as a string.
  // 0 means the event tracks no fee.
  feeAmountCents: integer('fee_amount_cents').notNull().default(0),
  feeCurrency: text('fee_currency').notNull().default('BRL'),
})
