export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(dateString))
}
