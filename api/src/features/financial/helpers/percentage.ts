export function toPercentage(paid: number, total: number): number {
  if (total <= 0) {
    return 0
  }

  return Math.round((paid / total) * 100)
}
