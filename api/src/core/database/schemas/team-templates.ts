import { pgTable, integer, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const teamTemplates = pgTable('team_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  key: text('key').notNull().unique(),
  maxCapacity: integer('max_capacity').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
