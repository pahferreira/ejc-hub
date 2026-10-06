import clsx from 'clsx'
import { ExperienceBadge } from '../ExperienceBadge/ExperienceBadge'
import { Pill } from '../Pill/Pill'
import { TeamPreferenceAvatars } from '../TeamPreferenceAvatars/TeamPreferenceAvatars'
import { UserAvatar } from '../UserAvatar/UserAvatar'
import { RequestMemberRowAction } from './RequestMemberRowAction'
import type { RequestMemberRow } from './requestMembersColumns'

export type RequestMembersListItemProps = {
  row: RequestMemberRow
  onRequest: (row: RequestMemberRow) => void
}

/**
 * The narrow-viewport stand-in for a table row, following `FeeMemberListItem`:
 * five columns do not survive a phone, so the same information stacks. The
 * `requested` tint carries over from the table row so the state reads the same
 * at both widths.
 */
export function RequestMembersListItem(props: RequestMembersListItemProps) {
  const { row } = props

  return (
    <li
      className={clsx(
        'flex flex-col gap-3 px-6 py-4',
        row.rowStatus === 'requested' && 'bg-table-highlight'
      )}
    >
      <div className="flex items-start gap-3">
        <UserAvatar name={row.name} pictureUrl={row.pictureUrl} />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-semibold text-dark-brown">{row.nickname}</span>
          <span className="text-xs font-medium text-secondary-foreground">{row.name}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ExperienceBadge experienceType={row.experienceType} circleKey={row.circleKey} />
        {row.areas.map((area) => (
          <Pill key={area}>{area}</Pill>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <TeamPreferenceAvatars preferences={row.preferences} />
        <RequestMemberRowAction row={row} onRequest={props.onRequest} />
      </div>
    </li>
  )
}
