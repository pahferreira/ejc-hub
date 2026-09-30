/**
 * The order people are listed in, everywhere a roster is rendered.
 *
 * Sorted by the nickname rather than the full name because that is what the row
 * renders in its primary position: a `PersonCard` puts "Lili" in bold and
 * "Liliane Souza" in the subtitle, so a list ordered by the full name reads as
 * unsorted to the person scanning it. The general rule, worth keeping when a new
 * list appears: **sort by whatever the row shows first.** The call-campaign PDF
 * is deliberately the exception — it prints only full names, so it sorts by
 * `name` in `CallCampaignService`.
 *
 * The nickname here is always the resolved one (see `resolveNickname`), never
 * the raw nullable column, which is why this can compare it directly.
 *
 * Accent- and case-insensitive (`sensitivity: 'base'`), so "Ju" and "Jú" sit
 * together instead of in separate runs. That makes ties common — three people
 * really are called "Ju" — so the full name breaks them, and the id breaks a tie
 * between two people who share both. Without that last step, paging is not
 * stable: the same person can appear on two pages or on none.
 *
 * Lives in `shared` rather than in a feature because five lists need it — the
 * team rosters, the team-building board's three columns, the fee member list,
 * the coordinator candidates and the requestable members — and a second copy is
 * how two screens start disagreeing about the order of the same people.
 */
export type SortablePerson = {
  userId: string
  name: string
  /** The resolved nickname, falling back to the first name. Never empty. */
  nickname: string
}

export function comparePeopleByNickname(first: SortablePerson, second: SortablePerson): number {
  return (
    first.nickname.localeCompare(second.nickname, 'pt-BR', { sensitivity: 'base' }) ||
    first.name.localeCompare(second.name, 'pt-BR', { sensitivity: 'base' }) ||
    first.userId.localeCompare(second.userId)
  )
}
