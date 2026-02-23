import { api } from '../api'
import type { SyncedUser } from './users.types'

async function syncUser() {
  const response = await api.post<{ user: SyncedUser }>('/users/sync')
  return response.data.user
}

export const usersApi = { syncUser }
