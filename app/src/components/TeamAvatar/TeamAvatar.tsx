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

function getInitials(name: string) {
  const [first = '', second = ''] = name.trim().split(/\s+/)
  return (first.charAt(0) + second.charAt(0)).toUpperCase()
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
