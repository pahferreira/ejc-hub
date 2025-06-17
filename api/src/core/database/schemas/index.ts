import { users } from './users.ts'
import { teamInstances } from './team-instances.ts'
import { subscriptionOptions } from './subscription-options.ts'
import { subscriptions } from './subscriptions.ts'
import { events } from './events.ts'
import { teamMemberships } from './team-memberships.ts'
import { teamTemplates } from './team-templates.ts'

export const schema = {
  events,
  subscriptionOptions,
  subscriptions,
  teamInstances,
  teamMemberships,
  teamTemplates,
  users,
}
