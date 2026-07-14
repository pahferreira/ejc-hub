import { pgEnum, pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core'
import { circles } from './circles.ts'

export const experienceType = pgEnum('experience_type', [
  'newbie',
  'experienced',
  'experienced_outsider',
])

export const gender = pgEnum('gender', ['male', 'female'])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  authId: text('auth_id').notNull(),
  email: text('email').unique().notNull(),
  phone: text('phone'),
  name: text('name').notNull(),
  nickname: text('nickname'),
  instagram: text('instagram'),
  pictureUrl: text('picture_url'),
  dateOfBirth: timestamp('date_of_birth'),
  emergencyContactName: text('emergency_contact_name'),
  emergencyContactPhone: text('emergency_contact_phone'),
  hasActingSkills: boolean('has_acting_skills').notNull().default(false),
  hasCommunicationSkills: boolean('has_communication_skills').notNull().default(false),
  hasCookingSkills: boolean('has_cooking_skills').notNull().default(false),
  hasDancingSkills: boolean('has_dancing_skills').notNull().default(false),
  hasManualSkills: boolean('has_manual_skills').notNull().default(false),
  hasMusicSkills: boolean('has_music_skills').notNull().default(false),
  hasSingingSkills: boolean('has_singing_skills').notNull().default(false),
  hasGuitarSkills: boolean('has_guitar_skills').notNull().default(false),
  hasPercussionSkills: boolean('has_percussion_skills').notNull().default(false),
  hasMidiaSkills: boolean('has_midia_skills').notNull().default(false),
  hasCoordinatorExperience: boolean('has_coordinator_experience').notNull().default(false),
  experienceType: experienceType().notNull().default('experienced'),
  circleId: uuid('circle_id').references(() => circles.id),
  gender: gender(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
