import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  authId: text('auth_id').notNull(),
  email: text('email').unique().notNull(),
  phone: text('phone'),
  name: text('name').notNull(),
  nickname: text('nickname'),
  pictureUrl: text('picture_url'),
  dateOfBirth: timestamp('date_of_birth'),
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
