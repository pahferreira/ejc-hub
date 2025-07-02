import { users } from './users.ts'
import { teamInstances } from './team-instances.ts'
import { subscriptionOptions } from './subscription-options.ts'
import { subscriptions } from './subscriptions.ts'
import { events } from './events.ts'
import { teamMemberships } from './team-memberships.ts'
import { teamTemplates } from './team-templates.ts'
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'

export const schema = {
  events,
  subscriptionOptions,
  subscriptions,
  teamInstances,
  teamMemberships,
  teamTemplates,
  users,
}

export type TeamTemplateModel = InferSelectModel<typeof teamTemplates>
export type TeamTemplateInput = InferInsertModel<typeof teamTemplates>

export type TeamInstanceModel = InferSelectModel<typeof teamInstances>
export type TeamInstanceInput = InferInsertModel<typeof teamInstances>

export type EventModel = InferSelectModel<typeof events>
export type EventInput = InferInsertModel<typeof events>
