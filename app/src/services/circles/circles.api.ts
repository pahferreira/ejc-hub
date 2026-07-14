import { api } from '../api'
import type { Circle } from './circles.types'

async function getCircles() {
  const response = await api.get<{ circles: Circle[] }>('/circles')

  return response.data.circles
}

export const circlesApi = {
  getCircles,
}
