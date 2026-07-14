import type { CircleModel } from '../../../core/database/schemas/index.ts'

export interface CircleRepository {
  listCircles: () => Promise<CircleModel[]>
  getCircleByKey: (key: string) => Promise<CircleModel | undefined>
}
