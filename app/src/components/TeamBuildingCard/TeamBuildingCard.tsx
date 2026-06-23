import { FiPhone } from 'react-icons/fi'
import { Card } from '../Card/Card'
import { Pill } from '../Pill/Pill'

export type TeamBuildingCardProps = {
  /** Person's full name. Used for the title and to derive the avatar initials. */
  name: string
  /** Optional badge label shown next to the name (e.g. "Novo"). Hidden when absent. */
  badge?: string
  /** Optional phone number. The phone line is hidden when absent. */
  phone?: string
  /** Inline attributes joined by a pipe (e.g. ["Música", "Teatro"]). Line hidden when empty. */
  attributes?: string[]
  /** Preference tags. The whole preferences section is hidden when empty/undefined. */
  preferences?: string[]
  /** Optional avatar image URL. Falls back to initials when absent. */
  avatarUrl?: string
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return '?'
  }
  const first = parts[0].charAt(0)
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : ''
  return (first + last).toUpperCase()
}

export function TeamBuildingCard(props: TeamBuildingCardProps) {
  const initials = getInitials(props.name)
  const hasAttributes = (props.attributes?.length ?? 0) > 0
  const hasPreferences = (props.preferences?.length ?? 0) > 0

  return (
    <Card className="cursor-grab transition-shadow hover:shadow-lg active:cursor-grabbing">
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-sm font-semibold text-dark-brown">
            {props.avatarUrl ? (
              <img src={props.avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              <span aria-hidden="true">{initials}</span>
            )}
          </span>

          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-dark-brown">{props.name}</span>
              {props.badge && (
                <span className="inline-flex items-center rounded-full bg-blue px-2.5 py-0.5 text-xs font-medium text-white">
                  {props.badge}
                </span>
              )}
            </div>

            {props.phone && (
              <a
                href={`tel:${props.phone}`}
                className="inline-flex w-fit items-center gap-1.5 text-sm text-black no-underline hover:underline"
              >
                <FiPhone className="shrink-0" size={14} aria-hidden="true" />
                {props.phone}
              </a>
            )}
          </div>
        </div>

        {hasAttributes && (
          <p className="m-0 text-sm text-secondary-foreground">{props.attributes?.join(' | ')}</p>
        )}

        {hasPreferences && (
          <>
            <hr className="m-0 border-t border-tertiary" />
            <div className="flex flex-col gap-2">
              <span className="font-mono text-xs font-semibold tracking-wide text-dark-brown uppercase">
                Preferências
              </span>
              <div className="flex flex-wrap gap-2">
                {props.preferences?.map((preference) => (
                  <Pill key={preference}>{preference}</Pill>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
