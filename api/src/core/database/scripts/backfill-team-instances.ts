import { eq } from 'drizzle-orm'
import { db } from '../client.ts'
import { schema } from '../schemas/index.ts'

// Backfills team instances for the current event. Useful when an event was
// created before some team templates existed, so it is missing their instances.
// Idempotent: only templates without an instance for the event get one.
async function main() {
  const [currentEvent] = await db
    .select({ id: schema.events.id, name: schema.events.name })
    .from(schema.events)
    .where(eq(schema.events.isCurrent, true))

  if (!currentEvent) {
    throw new Error('No current event found (events.is_current = true).')
  }

  const templates = await db
    .select({ id: schema.teamTemplates.id, name: schema.teamTemplates.name })
    .from(schema.teamTemplates)

  const existingInstances = await db
    .select({ templateId: schema.teamInstances.templateId })
    .from(schema.teamInstances)
    .where(eq(schema.teamInstances.eventId, currentEvent.id))

  const existingTemplateIds = new Set(existingInstances.map((instance) => instance.templateId))
  const missingTemplates = templates.filter((template) => !existingTemplateIds.has(template.id))

  console.log(`Current event: ${currentEvent.name} (${currentEvent.id})`)
  console.log(`Templates: ${templates.length}, existing instances: ${existingTemplateIds.size}`)

  if (missingTemplates.length === 0) {
    console.log('Nothing to backfill — every template already has an instance.')
    return
  }

  const inserted = await db
    .insert(schema.teamInstances)
    .values(
      missingTemplates.map((template) => ({ eventId: currentEvent.id, templateId: template.id }))
    )
    .returning({ id: schema.teamInstances.id, templateId: schema.teamInstances.templateId })

  const nameById = new Map(templates.map((template) => [template.id, template.name]))
  console.log(`Created ${inserted.length} team instance(s):`)
  inserted.forEach((instance) =>
    console.log(`  - ${nameById.get(instance.templateId)} (${instance.id})`)
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Backfill failed:')
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
