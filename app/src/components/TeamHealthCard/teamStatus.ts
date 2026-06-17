import type { TeamStatus } from '../../services/teams/teams.types'

export function getTeamStatus(memberCount: number, maxCapacity: number): TeamStatus {
  if (maxCapacity <= 0) {
    return 'needsMembers'
  }
  const ratio = memberCount / maxCapacity
  if (ratio >= 1) {
    return 'complete'
  }
  if (ratio >= 0.8) {
    return 'spotsAvailable'
  }
  return 'needsMembers'
}

type TeamStatusDisplay = {
  label: string
  badgeVariant: 'pending' | 'received' | 'completed'
}

export const teamStatusDisplay: Record<TeamStatus, TeamStatusDisplay> = {
  needsMembers: { label: 'Precisa de membros', badgeVariant: 'pending' },
  spotsAvailable: { label: 'Vagas disponíveis', badgeVariant: 'received' },
  complete: { label: 'Completa', badgeVariant: 'completed' },
}
