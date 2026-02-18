import { api } from '../api'

async function getHealthCheck(): Promise<{ message: string }> {
  const response = await api.get('/health')
  return response.data
}

export const generalApi = {
  getHealthCheck,
}
