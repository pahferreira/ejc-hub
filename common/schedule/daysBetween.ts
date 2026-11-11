const DAY_MS = 86_400_000

/** Whole calendar days from one `YYYY-MM-DD` to another (negative when earlier). */
export const daysBetween = (from: string, to: string): number =>
  (Date.parse(to) - Date.parse(from)) / DAY_MS
