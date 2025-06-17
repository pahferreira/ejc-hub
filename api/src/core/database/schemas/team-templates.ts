import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const teamTemplates = pgTable('team_template', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  key: text('key').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
