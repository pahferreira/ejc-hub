/**
 * Lowercases and strips diacritics so "Julia" finds "Júlia".
 *
 * pt-BR names carry accents that nobody types into a search box, and a plain
 * `toLowerCase().includes()` quietly returns nothing for them. `NFD` splits an
 * accented letter into its base plus a combining mark, which the range below
 * then removes.
 *
 * Lives in `shared` rather than inside a feature because more than one feature
 * searches people by name: the fee member list and the member-request lists
 * both do, and a second copy is how one of them silently stops matching
 * accented names.
 */
export function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}
