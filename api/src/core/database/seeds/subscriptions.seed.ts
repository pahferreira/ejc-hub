import { eq } from 'drizzle-orm'
import { faker } from '@faker-js/faker/locale/pt_BR'
import { db } from '../client.ts'
import { schema } from '../schemas/index.ts'
import { TEAM_TEMPLATE_KEYS } from './team-templates.seed.ts'

const TOTAL_USERS = 300
const TEAM_PICKS_PER_SUBSCRIPTION = 3
const MAX_PREVIOUS_EXPERIENCE_TEAMS = 4

const AVAILABILITY_OPTIONS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

const STATUS_OPTIONS = ['pending', 'received', 'completed', 'waiting_list'] as const

const EXPERIENCE_OPTIONS = ['newbie', 'experienced', 'experienced_outsider'] as const

type AvailabilityOption = (typeof AVAILABILITY_OPTIONS)[number]
type StatusOption = (typeof STATUS_OPTIONS)[number]
type ExperienceOption = (typeof EXPERIENCE_OPTIONS)[number]

function pickRandomDistinct<T>(items: T[], count: number): T[] {
  if (count > items.length) {
    throw new Error(
      `Cannot pick ${count} distinct items from a list of ${items.length}. ` +
        `Make sure enough source items are available.`
    )
  }
  return faker.helpers.shuffle([...items]).slice(0, count)
}

function buildRandomAvailability(): AvailabilityOption[] {
  const count = faker.number.int({ min: 1, max: AVAILABILITY_OPTIONS.length })
  return pickRandomDistinct([...AVAILABILITY_OPTIONS], count)
}

function buildRandomPreviousExperienceTeams(): string[] {
  const count = faker.number.int({ min: 0, max: MAX_PREVIOUS_EXPERIENCE_TEAMS })
  if (count === 0) return []
  return pickRandomDistinct(TEAM_TEMPLATE_KEYS, count)
}

export async function seedSubscriptions() {
  const [currentEvent] = await db
    .select({ id: schema.events.id, name: schema.events.name })
    .from(schema.events)
    .where(eq(schema.events.isCurrent, true))
    .limit(1)

  if (!currentEvent) {
    throw new Error(
      'No current event found. Create an event and mark it as `is_current = true` before seeding subscriptions.'
    )
  }

  const teamInstances = await db
    .select({ id: schema.teamInstances.id })
    .from(schema.teamInstances)
    .where(eq(schema.teamInstances.eventId, currentEvent.id))

  if (teamInstances.length < TEAM_PICKS_PER_SUBSCRIPTION) {
    throw new Error(
      `Found ${teamInstances.length} team instance(s) for event "${currentEvent.name}" (${currentEvent.id}). ` +
        `Subscriptions require ${TEAM_PICKS_PER_SUBSCRIPTION} distinct team picks each. ` +
        `Please create the team instances for this event via the team feature flow before running this seed ` +
        `(the seed will not auto-create them).`
    )
  }

  const teamInstanceIds = teamInstances.map((t) => t.id)

  const usersToInsert = Array.from({ length: TOTAL_USERS }, () => {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const email = faker.internet
      .email({ firstName, lastName, provider: 'seed.ejc-hub.local' })
      .toLowerCase()

    return {
      authId: `seed|${faker.string.uuid()}`,
      email,
      phone: faker.phone.number(),
      name: `${firstName} ${lastName}`,
      nickname: faker.helpers.maybe(() => faker.person.firstName(), { probability: 0.4 }) ?? null,
      pictureUrl: faker.helpers.maybe(() => faker.image.avatar(), { probability: 0.5 }) ?? null,
      dateOfBirth: faker.date.birthdate({ min: 18, max: 60, mode: 'age' }),
      emergencyContactName: faker.person.fullName(),
      emergencyContactPhone: faker.phone.number(),
      hasActingSkills: faker.datatype.boolean(),
      hasCommunicationSkills: faker.datatype.boolean(),
      hasCookingSkills: faker.datatype.boolean(),
      hasDancingSkills: faker.datatype.boolean(),
      hasManualSkills: faker.datatype.boolean(),
      hasMusicSkills: faker.datatype.boolean(),
      hasSingingSkills: faker.datatype.boolean(),
      hasCoordinatorExperience: faker.datatype.boolean(),
      experienceType: faker.helpers.arrayElement<ExperienceOption>([...EXPERIENCE_OPTIONS]),
    }
  })

  const insertedUsers = await db
    .insert(schema.users)
    .values(usersToInsert)
    .onConflictDoNothing({ target: schema.users.email })
    .returning({ id: schema.users.id })

  if (insertedUsers.length === 0) {
    throw new Error(
      'No users were inserted. The randomly generated emails likely collided with existing rows; re-run the seed to retry.'
    )
  }

  const subscriptionsToInsert = insertedUsers.map((user) => ({
    userId: user.id,
    eventId: currentEvent.id,
    status: faker.helpers.arrayElement<StatusOption>([...STATUS_OPTIONS]),
    availability: buildRandomAvailability(),
    details: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }) ?? '',
    previousExperienceTeams: buildRandomPreviousExperienceTeams(),
  }))

  const insertedSubscriptions = await db
    .insert(schema.subscriptions)
    .values(subscriptionsToInsert)
    .onConflictDoNothing({ target: [schema.subscriptions.userId, schema.subscriptions.eventId] })
    .returning({ id: schema.subscriptions.id })

  const subscriptionOptionsToInsert = insertedSubscriptions.flatMap((subscription) => {
    const picks = pickRandomDistinct(teamInstanceIds, TEAM_PICKS_PER_SUBSCRIPTION)
    return picks.map((teamInstanceId) => ({
      subscriptionId: subscription.id,
      teamInstanceId,
    }))
  })

  if (subscriptionOptionsToInsert.length > 0) {
    await db.insert(schema.subscriptionOptions).values(subscriptionOptionsToInsert)
  }

  return {
    eventId: currentEvent.id,
    eventName: currentEvent.name,
    usersInserted: insertedUsers.length,
    subscriptionsInserted: insertedSubscriptions.length,
    subscriptionOptionsInserted: subscriptionOptionsToInsert.length,
    teamInstancesAvailable: teamInstanceIds.length,
  }
}
