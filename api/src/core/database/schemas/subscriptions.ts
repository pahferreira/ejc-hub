import { pgTable, timestamp, pgEnum, uuid } from 'drizzle-orm/pg-core'
import { users } from './users.ts'
import { events } from './events.ts'

export const subscriptionStatus = pgEnum('subscription_status', [
  'pending',
  'received',
  'completed',
  'waiting_list',
])

export const subscriptionAvailability = pgEnum('subscription_availability', [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
])

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  eventId: uuid('event_id')
    .references(() => events.id)
    .notNull(),
  status: subscriptionStatus().notNull().default('pending'),
  availability: subscriptionAvailability().notNull().array().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
