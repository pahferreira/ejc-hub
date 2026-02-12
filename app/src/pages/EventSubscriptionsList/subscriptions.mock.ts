import type { SubscriptionWithDetails } from './subscription.types'

export const mockSubscriptions: SubscriptionWithDetails[] = [
  {
    id: '1',
    status: 'pending',
    createdAt: '2026-01-15T10:30:00Z',
    teams: ['Liturgy', 'Music', 'Communication'],
    user: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+1 (555) 123-4567',
    },
  },
  {
    id: '2',
    status: 'received',
    createdAt: '2026-01-14T14:20:00Z',
    teams: ['Kitchen', 'Logistics'],
    user: {
      name: 'Michael Chen',
      email: 'michael.chen@example.com',
      phone: '+1 (555) 234-5678',
    },
  },
  {
    id: '3',
    status: 'pending',
    createdAt: '2026-01-16T09:15:00Z',
    teams: ['Coordination'],
    user: {
      name: 'Emily Rodriguez',
      email: 'emily.r@example.com',
      phone: '+1 (555) 345-6789',
    },
  },
  {
    id: '4',
    status: 'completed',
    createdAt: '2026-01-10T16:45:00Z',
    teams: ['Music', 'Liturgy'],
    user: {
      name: 'James Wilson',
      email: 'j.wilson@example.com',
      phone: null,
    },
  },
  {
    id: '5',
    status: 'waiting_list',
    createdAt: '2026-01-17T11:00:00Z',
    teams: ['Communication', 'Logistics'],
    user: {
      name: 'Maria Santos',
      email: 'maria.santos@example.com',
      phone: '+1 (555) 456-7890',
    },
  },
]
