import { z } from 'zod/v4'

export const eventIdParamSchema = z.object({
  eventId: z.uuid(),
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
    isNewbie: z.boolean().optional(),
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
  }),
  options: z.array(z.string()).length(3, 'Exactly 3 options are required'),
  availability: z
    .array(subscriptionAvailabilityEnum)
    .min(1, 'At least one availability day is required'),
})

export const teamKeysQuerystringSchema = z.object({
  teamKeys: z.preprocess((value) => {
    if (typeof value === 'string') {
      return value.split(',')
    }
  }, z.array(z.string()).optional()),
})

export const paginationQuerystringSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  size: z.coerce.number().int().min(1).optional(),
})

export const listSubscriptionsQuerystringSchema = z.object({
  name: z.string().optional(),
  ...teamKeysQuerystringSchema.shape,
  ...paginationQuerystringSchema.shape,
})

// TODO: this schema is currently duplicated with the one in the frontend, we should find a way to share it.
// Creating a /common/contracts package that both frontend and backend can depend on would be ideal, but for now we can just copy it.
export const subscribeCurrentSchema = z.object({
  fullName: z.string('Full name is required').nonempty(),
  nickname: z.string('Nickname is required').nonempty(),
  email: z.email('Email is required'),
  phone: z.string('Phone number is required').nonempty(),
  emergencyContactName: z.string('Emergency contact name is required').nonempty(),
  emergencyContactPhone: z.string('Emergency contact phone is required').nonempty(),
  isNewbie: z.boolean().optional(),
  hasCoordinatorExperience: z.boolean().optional(),
  selectedSkills: z.array(z.string()),
  selectedTeams: z.array(z.string()),
  details: z.string().optional(),
  previousExperienceTeams: z.array(z.string()),
  availability: z
    .array(subscriptionAvailabilityEnum)
    .min(1, 'At least one availability day is required'),
})
