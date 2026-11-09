import type { TeamColorToken } from '../../../../common/schedule/teamColorToken'

/** Maps a team's circle color token to the hex the card paints the dot with. */
const TEAM_COLOR_HEX: Record<TeamColorToken, string> = {
  rose: '#e11d48',
  amber: '#d97706',
  emerald: '#059669',
  sky: '#0284c7',
  violet: '#7c3aed',
  orange: '#ea580c',
  teal: '#0d9488',
  pink: '#db2777',
  lime: '#65a30d',
  indigo: '#4f46e5',
}

const FALLBACK = '#78716c'

/** The circle color for a token, falling back to a neutral gray if unknown. */
export function teamColorHex(token: string): string {
  return TEAM_COLOR_HEX[token as TeamColorToken] ?? FALLBACK
}
