export type TeamAvatarSize = 'sm' | 'md'

export type TeamAvatarProps = {
  /** Team name used to derive initials and the hover tooltip */
  name: string
  /** Visual size of the avatar. Defaults to `md`. */
  size?: TeamAvatarSize
}

const sizeClasses: Record<TeamAvatarSize, string> = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
}

/**
 * Connector words (Portuguese) that should be skipped when deriving initials
 * from multi-word names, so "Som e Iluminação" -> "SI" (not "SE").
 */
const CONNECTOR_WORDS = new Set(['e', 'de', 'da', 'do', 'das', 'dos', 'aos', 'e/ou'])

export function getInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  const meaningfulWords = words.filter((word) => !CONNECTOR_WORDS.has(word.toLowerCase()))

  // Fall back to the raw words if the name is made up entirely of connectors.
  const relevantWords = meaningfulWords.length > 0 ? meaningfulWords : words

  // Single meaningful word -> first two letters (e.g. "Som" -> "SO").
  if (relevantWords.length === 1) {
    return relevantWords[0].slice(0, 2).toUpperCase()
  }

  // Multiple words -> first letter of each of the first two (e.g. "Som e Iluminação" -> "SI").
  return (relevantWords[0].charAt(0) + relevantWords[1].charAt(0)).toUpperCase()
}

export function TeamAvatar(props: TeamAvatarProps) {
  const initials = getInitials(props.name)

  return (
    <figure title={props.name} aria-label={props.name} className="inline-flex cursor-default">
      <span
        aria-hidden
        className={`flex shrink-0 items-center justify-center rounded-full bg-dark-brown font-semibold text-white ${sizeClasses[props.size ?? 'md']}`}
      >
        {initials}
      </span>
    </figure>
  )
}
