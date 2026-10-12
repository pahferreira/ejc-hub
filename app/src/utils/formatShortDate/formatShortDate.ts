/**
 * `dd/MM`, for a date list with no room for a full timestamp.
 *
 * `timeZone: 'UTC'` pins it the same way `formatDate` does — the API sends
 * UTC instants, and formatting in the browser's local zone would drift the
 * day near midnight.
 */
export function formatShortDate(dateString: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(dateString))
}
