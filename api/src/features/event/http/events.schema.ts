import { z } from 'zod/v4'
import { SubscriptionStatus } from '../../../modules/subscription/domain/subscription.types.ts'
import { commaSeparated } from '../../../shared/comma-separated.ts'
import { EXPERIENCE_TYPES } from '../../../../../common/skills/skill.constants.ts'

const experienceTypeEnum = z.enum(EXPERIENCE_TYPES)
const genderEnum = z.enum(['male', 'female'])

export const eventIdParamSchema = z.object({
  eventId: z.uuid(),
})

export const teamKeyParamSchema = z.object({
  teamKey: z.string(),
})

export const subscriptionAvailabilityEnum = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
])

export const subscribeBodySchema = z.object({
  user: z.object({
    emergencyContactName: z.string('emergency contact name is required').nonempty(),
    emergencyContactPhone: z.string('emergency contact phone is required').nonempty(),
    gender: genderEnum,
    experienceType: experienceTypeEnum,
    hasCoordinatorExperience: z.boolean().optional(),
  }),
  skills: z.object({
    hasActingSkills: z.boolean().optional(),
    hasCommunicationSkills: z.boolean().optional(),
    hasCookingSkills: z.boolean().optional(),
    hasDancingSkills: z.boolean().optional(),
    hasManualSkills: z.boolean().optional(),
    hasMusicSkills: z.boolean().optional(),
    hasSingingSkills: z.boolean().optional(),
    hasGuitarSkills: z.boolean().optional(),
    hasPercussionSkills: z.boolean().optional(),
    hasMidiaSkills: z.boolean().optional(),
  }),
  options: z.array(z.string()).length(3, 'Exactly 3 options are required'),
  availability: z
    .array(subscriptionAvailabilityEnum)
    .min(1, 'At least one availability day is required'),
})

export const teamStatusEnum = z.enum(['needsMembers', 'spotsAvailable', 'complete'])

export const listCurrentTeamsQuerystringSchema = z.object({
  name: z.string().trim().min(1).optional(),
  status: teamStatusEnum.optional(),
})

export const teamKeysQuerystringSchema = z.object({
  teamKeys: commaSeparated(z.string()),
})

export const MAX_PAGE_SIZE = 100

export const paginationQuerystringSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  size: z.coerce.number().int().min(1).optional(),
})

export const listSubscriptionsQuerystringSchema = z.object({
  name: z.string().optional(),
  ...teamKeysQuerystringSchema.shape,
  ...paginationQuerystringSchema.shape,
})

export const subscriptionStatusEnum = z.enum([
  SubscriptionStatus.Pending,
  SubscriptionStatus.Received,
  SubscriptionStatus.Completed,
  SubscriptionStatus.WaitingList,
  SubscriptionStatus.Cancelled,
])

export const statusQuerystringSchema = z.object({
  status: commaSeparated(subscriptionStatusEnum),
})

export const currentSubscriptionsPaginationQuerystringSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).optional(),
})

/**
 * The "Lista de Inscrições" table's controls.
 *
 * `skills` carries the snake_case wire values from the shared skill vocabulary,
 * not the Portuguese labels, so renaming a label on screen cannot change what
 * this endpoint accepts. `experience` is `experienceType` only — the separate
 * `hasCoordinatorExperience` boolean is deliberately not filterable here.
 *
 * `name` must be a non-empty string once trimmed, so a blank search term can
 * never match everything through an empty `includes`. The table omits the
 * parameter altogether when the box is empty, so that bound is never hit from
 * the UI.
 */
export const listCurrentSubscriptionsQuerystringSchema = z.object({
  name: z.string().trim().min(1).optional(),
  ...teamKeysQuerystringSchema.shape,
  ...statusQuerystringSchema.shape,
  skills: commaSeparated(z.string()),
  experience: commaSeparated(experienceTypeEnum),
  ...currentSubscriptionsPaginationQuerystringSchema.shape,
})

// TODO: this schema is currently duplicated with the one in the frontend, we should find a way to share it.
// Creating a /common/contracts package that both frontend and backend can depend on would be ideal, but for now we can just copy it.
export const subscribeCurrentSchema = z.object({
  fullName: z.string('Full name is required').nonempty(),
  nickname: z.string('Nickname is required').nonempty(),
  instagram: z.string().optional(),
  dateOfBirth: z.iso.date('Date of birth must be a yyyy-mm-dd date').optional(),
  email: z.email('Email is required'),
  phone: z.string('Phone number is required').nonempty(),
  emergencyContactName: z.string('Emergency contact name is required').nonempty(),
  emergencyContactPhone: z.string('Emergency contact phone is required').nonempty(),
  gender: genderEnum,
  experienceType: experienceTypeEnum,
  circle: z.string().nonempty().optional(),
  hasCoordinatorExperience: z.boolean().optional(),
  selectedSkills: z.array(z.string()),
  selectedTeams: z.array(z.string()),
  details: z.string().optional(),
  workingAnotherEvent: z.boolean().optional(),
  previousExperienceTeams: z.array(z.string()),
  availability: z
    .array(subscriptionAvailabilityEnum)
    .min(1, 'At least one availability day is required'),
  alreadyWorkedHere: z.boolean().optional(),
  alreadyWorkedEvent: z.string().optional(),
  alreadyWorkedTeams: z.string().optional(),
  groups: z.string().optional(),
})
