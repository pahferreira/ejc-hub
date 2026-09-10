/**
 * The name a person is actually called, falling back to the first word of their
 * full name when no nickname is on file.
 *
 * Lives in `shared` rather than inside a feature because more than one feature
 * renders a person: the team-building board, the team rosters, and the financial
 * member lists all show the same "Mari / Maria Silva" pairing, and they must not
 * each grow their own fallback rule.
 */
export function resolveNickname(name: string, nickname: string | null): string {
  return nickname?.trim() || name.trim().split(/\s+/)[0] || name
}
