import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../client.ts'
import { schema } from '../schemas/index.ts'

export const TEST_EVENT_NAME = 'Evento de Teste'

export async function seedEvents() {
  const [existingEvent] = await db
    .select({ id: schema.events.id })
    .from(schema.events)
    .where(and(eq(schema.events.name, TEST_EVENT_NAME), isNull(schema.events.deletedAt)))
    .limit(1)

  // Only take the is_current flag when no event holds it — never steal it
  // from a real event.
  const [currentEvent] = await db
    .select({ id: schema.events.id })
    .from(schema.events)
    .where(and(eq(schema.events.isCurrent, true), isNull(schema.events.deletedAt)))
    .limit(1)

  const event =
    existingEvent ??
    (
      await db
        .insert(schema.events)
        .values({
          name: TEST_EVENT_NAME,
          description: 'Evento criado automaticamente pelo seed para testes.',
          theme: 'Permanecei em mim',
          song: 'Eu Sou de Cristo',
          biblePassage: 'Jo 15,5',
          isCurrent: !currentEvent,
        })
        .returning({ id: schema.events.id })
    )[0]

  const templates = await db.select({ id: schema.teamTemplates.id }).from(schema.teamTemplates)

  if (templates.length === 0) {
    throw new Error('No team templates found. Run the team-templates seed first.')
  }

  const existingInstances = await db
    .select({ templateId: schema.teamInstances.templateId })
    .from(schema.teamInstances)
    .where(eq(schema.teamInstances.eventId, event.id))

  const existingTemplateIds = new Set(existingInstances.map((instance) => instance.templateId))

  const instancesToInsert = templates
    .filter((template) => !existingTemplateIds.has(template.id))
    .map((template) => ({ templateId: template.id, eventId: event.id }))

  if (instancesToInsert.length > 0) {
    await db.insert(schema.teamInstances).values(instancesToInsert)
  }

  return {
    eventId: event.id,
    eventName: TEST_EVENT_NAME,
    eventCreated: !existingEvent,
    teamInstancesInserted: instancesToInsert.length,
    teamInstancesSkipped: existingTemplateIds.size,
  }
}
