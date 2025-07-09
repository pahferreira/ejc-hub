import { pgTable, text, timestamp, boolean, pgEnum, uuid } from 'drizzle-orm/pg-core'
import { users } from './users.ts'

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
  id: text('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  emergencyContactName: text('emergency_contact_name').notNull(),
  emergencyContactPhone: text('emergency_contact_phone').notNull(),
  isNewbie: boolean('is_newbie').notNull().default(false),
  status: subscriptionStatus().notNull().default('pending'),
  availability: subscriptionAvailability().notNull().array().default([]),
  hasCoordinatorExperience: boolean('has_coordinator_experience').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
