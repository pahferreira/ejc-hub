import { TeamAvatar } from '../TeamAvatar/TeamAvatar'

export type TeamPreferenceAvatarsProps = {
  /** The teams a candidate listed on their signup form, in order. */
  preferences: { teamInstanceId: string; name: string }[]
}

const MAX_VISIBLE = 3

/**
 * The "Escolhas de Equipe" column: an overlapping stack of the teams a
 * candidate put on their signup form.
 *
 * `TeamAvatar` takes no `className`, so each avatar is wrapped in its own
 * `span` here — the `-space-x-2` overlap is a margin on those wrappers, not on
 * the avatar itself, following the same pattern `TeamHealthCard` uses for its
 * coordinator stack.
 *
 * Capped at three: a fourth avatar has nowhere to go in the column, and the
 * full ordered list is always available in the `title` tooltip.
 */
export function TeamPreferenceAvatars(props: TeamPreferenceAvatarsProps) {
  if (props.preferences.length === 0) {
    return <span className="text-sm text-dark-brown/40">—</span>
  }

  const visible = props.preferences.slice(0, MAX_VISIBLE)
  const hiddenCount = props.preferences.length - visible.length
  const fullList = props.preferences.map((preference) => preference.name).join(', ')

  return (
    <div className="flex shrink-0 items-center -space-x-1" title={fullList}>
      {visible.map((preference) => (
        <span
          key={preference.teamInstanceId}
          aria-hidden="true"
          className="rounded-full border-2 border-white"
        >
          <TeamAvatar name={preference.name} size="sm" />
        </span>
      ))}
      {hiddenCount > 0 && (
        <span
          aria-hidden="true"
          className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-tertiary text-xs font-semibold text-dark-brown"
        >
          +{hiddenCount}
        </span>
      )}
    </div>
  )
}
