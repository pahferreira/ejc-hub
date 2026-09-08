/**
 * Picks the pt-BR singular or plural wording for a count.
 *
 * Callers pass whole phrases rather than a stem plus suffix, because Portuguese
 * agreement runs across the noun *and* its adjective ("1 membro selecionado" vs
 * "2 membros selecionados"), which no suffix rule can produce.
 *
 * Zero takes the plural, as it does in pt-BR ("0 membros selecionados").
 */
export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}
