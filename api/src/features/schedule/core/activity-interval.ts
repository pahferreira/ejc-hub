const MINUTE_MS = 60_000

/** The end instant of an activity: its start plus its duration. */
export function activityEnd(start: Date, durationMinutes: number): Date {
  return new Date(start.getTime() + durationMinutes * MINUTE_MS)
}

/** Half-open intervals `[start, end)` overlap; touching edges do not. */
export function intervalsOverlap(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return startA < endB && startB < endA
}
