/**
 * Teams have no colour in the data model, so the row dot is derived from the
 * team key instead. Deliberately not `TeamBox`'s random picker: that re-rolls on
 * every mount, which would make the same team a different colour on each render.
 *
 * If teams ever gain a real colour column this is the single place to replace.
 */
const TEAM_DOT_COLORS = [
  'bg-blue',
  'bg-green',
  'bg-red',
  'bg-orange',
  'bg-primary',
  'bg-dark-brown',
] as const

export function getTeamDotColor(teamKey: string): string {
  let hash = 0
  for (let index = 0; index < teamKey.length; index += 1) {
    hash = (hash * 31 + teamKey.charCodeAt(index)) | 0
  }

  return TEAM_DOT_COLORS[Math.abs(hash) % TEAM_DOT_COLORS.length]
}
