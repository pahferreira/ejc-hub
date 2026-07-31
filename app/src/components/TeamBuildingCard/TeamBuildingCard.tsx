import type { ReactNode } from 'react'
import { FiCalendar, FiPhone, FiUser } from 'react-icons/fi'
import { Card } from '../Card/Card'
import { Pill } from '../Pill/Pill'
import { UserAvatar } from '../UserAvatar/UserAvatar'
import { WeekAvailability } from '../WeekAvailability/WeekAvailability'

export type TeamBuildingCardProps = {
  /** Person's full name. Used for the title and to derive the avatar initials. */
  name: string
  /** Nickname shown next to the name (e.g. "Lili"). Hidden when blank. */
  nickname: string
  /** Optional badge shown under the nickname (e.g. an ExperienceBadge). Hidden when absent. */
  badge?: ReactNode
  /** Optional phone number. The phone line is hidden when absent. */
  phone?: string
  /** Inline attributes joined by a pipe (e.g. ["Música", "Teatro"]). Line hidden when empty. */
  attributes?: string[]
  /** Preference tags. The whole preferences section is hidden when empty/undefined. */
  preferences?: string[]
  /** Optional avatar image URL. Falls back to initials when absent. */
  avatarUrl?: string
  /** Days of the week the member is available (e.g. ["monday", "friday"]). Hidden when absent. */
  weekAvailability?: string[]
}

export function TeamBuildingCard(props: TeamBuildingCardProps) {
  const hasAttributes = (props.attributes?.length ?? 0) > 0
  const hasPreferences = (props.preferences?.length ?? 0) > 0
  const hasWeekAvailability = (props.weekAvailability?.length ?? 0) > 0

  return (
    <Card className="cursor-grab transition-shadow hover:shadow-lg active:cursor-grabbing">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <UserAvatar name={props.name} pictureUrl={props.avatarUrl} size="default" />

          <div className="flex min-w-0 flex-col">
            <span className="font-semibold text-dark-brown">{props.nickname}</span>
            {props.badge && <div className="w-fit">{props.badge}</div>}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <FiUser size={12} />
            <p className="m-0 text-xs text-secondary-foreground font-medium">{props.name}</p>
          </div>
          {props.phone && (
            <div className="flex items-center gap-1">
              <FiPhone size={12} />
              <p className="m-0 text-xs text-secondary-foreground font-medium">{props.phone}</p>
            </div>
          )}
          {hasWeekAvailability && (
            <div className="flex items-center gap-1.5" title="Disponibilidade da semana">
              <FiCalendar size={12} className="shrink-0 text-secondary-foreground" />
              <WeekAvailability weekAvailability={props.weekAvailability} />
            </div>
          )}
          {hasAttributes && (
            <p className="m-0 text-xs text-secondary-foreground">{props.attributes?.join(' | ')}</p>
          )}
        </div>

        {hasPreferences && (
          <>
            <hr className="m-0 border-t border-tertiary" />
            <div className="flex flex-col gap-2">
              <span className="font-mono text-xs font-semibold tracking-wide text-dark-brown uppercase">
                Preferências
              </span>
              <div className="flex flex-wrap gap-2">
                {props.preferences?.map((preference) => (
                  <Pill key={preference} variant="primary">
                    {preference}
                  </Pill>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
