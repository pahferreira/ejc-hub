import type { SubscriptionWithDetails } from '../domain/subscription-types.ts'
import type { TeamPerson } from '../domain/team-overview.types.ts'
import { resolveNickname } from '../../../shared/resolve-nickname.ts'
import { formatAreas } from './format-areas.ts'

// Maps a subscription row onto the common person shape shared by the
// team-building board members and the team detail roster (coordinators/members).
export function mapSubscriptionToPerson(
  subscription: SubscriptionWithDetails,
  instanceNameById: Map<string, string>
): TeamPerson {
  return {
    userId: subscription.userId,
    name: subscription.user.name,
    nickname: resolveNickname(subscription.user.name, subscription.user.nickname),
    phone: subscription.user.phone,
    pictureUrl: subscription.user.pictureUrl,
    experienceType: subscription.user.experienceType,
    circleKey: subscription.user.circle?.key ?? null,
    areas: formatAreas(subscription.user),
    details: subscription.details ?? '',
    preferences: (subscription.teams ?? [])
      .map((teamInstanceId) => instanceNameById.get(teamInstanceId))
      .filter((name): name is string => Boolean(name)),
    weekAvailability: subscription.availability ?? [],
  }
}
