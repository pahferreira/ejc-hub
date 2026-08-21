// Splits `items` into exactly `groupCount` contiguous groups of near-equal size.
// The LAST `remainder` groups carry one extra item, so early groups are never
// heavier than late ones. Group sizes differ by at most 1.
export function splitIntoGroups<T>(items: T[], groupCount: number): T[][] {
  if (groupCount <= 0) return []

  const base = Math.floor(items.length / groupCount)
  const remainder = items.length % groupCount
  const groups: T[][] = []
  let cursor = 0

  for (let index = 0; index < groupCount; index++) {
    const size = base + (index >= groupCount - remainder ? 1 : 0)
    groups.push(items.slice(cursor, cursor + size))
    cursor += size
  }

  return groups
}
