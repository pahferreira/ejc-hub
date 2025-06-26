import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  name: text('name').notNull(),
  nickname: text('nickname').notNull(),
  dateOfBirth: timestamp('date_of_birth').notNull(),
  hasMusicSkills: boolean('has_music_skills').notNull().default(false),
  hasActingSkills: boolean('has_acting_skills').notNull().default(false),
  hasDancingSkills: boolean('has_dancing_skills').notNull().default(false),
  hasSingingSkills: boolean('has_singing_skills').notNull().default(false),
  hasManualSkills: boolean('has_manual_skills').notNull().default(false),
  hasCookingSkills: boolean('has_cooking_skills').notNull().default(false),
  hasCommunicationSkills: boolean('has_communication_skills').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
