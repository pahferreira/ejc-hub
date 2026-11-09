/**
 * A small, fixed palette of color tokens for the circle shown next to a team on
 * a schedule activity. The API and the app share this so a team always draws the
 * same circle on both sides. A token is a name, not a color: the app maps it to
 * an actual value.
 */
export const TEAM_COLOR_TOKENS = [
  'rose',
  'amber',
  'emerald',
  'sky',
  'violet',
  'orange',
  'teal',
  'pink',
  'lime',
  'indigo',
] as const

export type TeamColorToken = (typeof TEAM_COLOR_TOKENS)[number]

/**
 * The circle color token for a team, picked from its key so it is stable: the
 * same team always gets the same circle, whatever order the teams come in.
 */
export const teamColorToken = (key: string): TeamColorToken => {
  let hash = 0
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0
  }
  return TEAM_COLOR_TOKENS[hash % TEAM_COLOR_TOKENS.length]
}
