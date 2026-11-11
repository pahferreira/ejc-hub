const MINUTE_MS = 60_000

/** The end instant of an activity: its start plus its duration. */
export function activityEnd(start: Date, durationMinutes: number): Date {
  return new Date(start.getTime() + durationMinutes * MINUTE_MS)
}

/** Half-open intervals `[start, end)` overlap; touching edges do not. */
export function intervalsOverlap(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return startA < endB && startB < endA
}

/** What placing an activity in time needs: when it starts and how long it runs. */
export type PlannedInterval = {
  plannedStartsAt: Date
  durationMinutes: number
}

/** Whether an activity overlaps any of the others (touching edges do not). */
export function overlapsAny(activity: PlannedInterval, others: PlannedInterval[]): boolean {
  const end = activityEnd(activity.plannedStartsAt, activity.durationMinutes)
  return others.some((other) =>
    intervalsOverlap(
      activity.plannedStartsAt,
      end,
      other.plannedStartsAt,
      activityEnd(other.plannedStartsAt, other.durationMinutes)
    )
  )
}
