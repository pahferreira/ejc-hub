import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const teamTemplates = pgTable('team_template', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  key: text('key').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
