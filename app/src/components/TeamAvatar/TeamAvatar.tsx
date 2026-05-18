export type TeamAvatarProps = {
  /** Team name used to derive initials and the hover tooltip */
  name: string
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
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dark-brown text-sm font-semibold text-white"
      >
        {initials}
      </span>
    </figure>
  )
}
