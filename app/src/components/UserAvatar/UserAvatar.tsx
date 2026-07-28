import { useState } from 'react'
import { getInitials } from './getInitials'

export type UserAvatarSize = 'small' | 'default'

export type UserAvatarProps = {
  /** Person's full name, used to derive the initials fallback. */
  name: string
  /** Optional photo URL. Falls back to initials when absent or broken. */
  pictureUrl?: string | null
  /** Visual size of the avatar. Defaults to `default`. */
  size?: UserAvatarSize
}

const sizeClasses: Record<UserAvatarSize, string> = {
  default: 'size-10 text-sm',
  small: 'size-8 text-xs',
}

export function UserAvatar(props: UserAvatarProps) {
  const size = props.size ?? 'default'
  const [hasErrored, setHasErrored] = useState(false)
  const initials = getInitials(props.name)
  const showImage = Boolean(props.pictureUrl) && !hasErrored

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-dark-brown font-semibold text-white ${sizeClasses[size]}`}
    >
      {showImage ? (
        <img
          src={props.pictureUrl ?? undefined}
          alt=""
          referrerPolicy="no-referrer"
          className="size-full object-cover"
          onError={() => setHasErrored(true)}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </span>
  )
}
