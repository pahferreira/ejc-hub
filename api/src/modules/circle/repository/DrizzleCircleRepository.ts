import { asc, eq } from 'drizzle-orm'
import { db } from '../../../core/database/client.ts'
import { schema } from '../../../core/database/schemas/index.ts'
import type { CircleRepository } from '../domain/CircleRepository.ts'

class DrizzleCircleRepository implements CircleRepository {
  async listCircles() {
    return db.select().from(schema.circles).orderBy(asc(schema.circles.label))
  }

  async getCircleByKey(key: string) {
    const results = await db.select().from(schema.circles).where(eq(schema.circles.key, key))
    return results[0]
  }
}

export const circleRepository = new DrizzleCircleRepository()
