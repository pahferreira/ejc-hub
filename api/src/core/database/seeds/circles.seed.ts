import { db } from '../client.ts'
import { schema } from '../schemas/index.ts'

type CircleSeed = {
  key: string
  label: string
  color: string
}

const CIRCLES: CircleSeed[] = [
  { key: 'red', label: 'Vermelho', color: 'red' },
  { key: 'green', label: 'Verde', color: 'green' },
  { key: 'blue', label: 'Azul', color: 'blue' },
]

export const CIRCLE_KEYS = CIRCLES.map((circle) => circle.key)

export async function seedCircles() {
  const inserted = await db
    .insert(schema.circles)
    .values(CIRCLES)
    .onConflictDoNothing({ target: schema.circles.key })
    .returning({
      id: schema.circles.id,
      key: schema.circles.key,
    })

  return {
    attempted: CIRCLES.length,
    inserted: inserted.length,
    skipped: CIRCLES.length - inserted.length,
  }
}
