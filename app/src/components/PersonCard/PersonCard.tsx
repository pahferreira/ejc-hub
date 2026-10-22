import type { ReactNode } from 'react'
import { FiCalendar, FiPhone, FiTrash2, FiUser } from 'react-icons/fi'
import { ButtonIcon } from '../ButtonIcon/ButtonIcon'
import { CopyButton } from '../CopyButton/CopyButton'
import { Card } from '../Card/Card'
import { UserAvatar } from '../UserAvatar/UserAvatar'
import { WeekAvailability } from '../WeekAvailability/WeekAvailability'

export type PersonCardProps = {
  /** Person's full name. Used for the subtitle and to derive the avatar initials. */
  name: string
  /** Nickname shown next to the name (e.g. "Lili"). */
  nickname: string
  /** Optional badge shown under the nickname (e.g. an ExperienceBadge). Hidden when absent. */
  badge?: ReactNode
  /** Optional phone number. The phone line is hidden when absent. */
  phone?: string
  /** Optional avatar image URL. Falls back to initials when absent. */
  avatarUrl?: string
  /** Inline attributes joined by a pipe (e.g. ["Música", "Teatro"]). Line hidden when empty. */
  attributes?: string[]
  /** Days of the week the person is available (e.g. ["monday", "friday"]). Hidden when absent. */
  weekAvailability?: string[]
  /** Role label shown next to the name (e.g. "Coordenador"). Omitted from the subtitle when absent. */
  role?: string
  /** Shows the status chip row (fee + shirt) below a divider. */
  showStatusChips?: boolean
  /**
   * The person's fee standing chip (e.g. a `MemberFeeStatusPill`). A slot rather
   * than a status value so this stays presentational and free of finance types,
   * the same way `badge` takes an `ExperienceBadge`.
   *
   * Omitted simply renders no fee chip. There is deliberately no "em breve"
   * fallback: the fee is real data now, and a placeholder no caller can reach
   * would only invite someone to start showing it again.
   */
  feeStatusChip?: ReactNode
  /**
   * The person's Presença block (a `PersonAttendanceBlock`), shown below its own
   * divider. A slot for the same reason as `feeStatusChip`. Omitted renders
   * nothing, so each page decides who sees whose attendance.
   */
  attendance?: ReactNode
  /** Shows a top-right delete button when provided. */
  onRemove?: () => void
  /** Accessible label for the delete button. Defaults to "Remover". */
  removeAriaLabel?: string
}

/** Dashed placeholder for a status the API cannot answer yet. */
function ComingSoonChip(props: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-dashed border-tertiary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
      {props.label}
    </span>
  )
}

export function PersonCard(props: PersonCardProps) {
  const hasAttributes = (props.attributes?.length ?? 0) > 0
  const hasWeekAvailability = (props.weekAvailability?.length ?? 0) > 0
  const subtitle = props.role ? `${props.name} · ${props.role}` : props.name

  return (
    <Card className="relative">
      {props.onRemove && (
        <div className="absolute right-3 top-3">
          <ButtonIcon
            icon={<FiTrash2 />}
            ariaLabel={props.removeAriaLabel ?? 'Remover'}
            onClick={props.onRemove}
          />
        </div>
      )}

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
            <p className="m-0 text-xs text-secondary-foreground font-medium">{subtitle}</p>
          </div>
          {props.phone && (
            <div className="flex items-center gap-1">
              <FiPhone size={12} />
              <p className="m-0 text-xs text-secondary-foreground font-medium">{props.phone}</p>
              <CopyButton value={props.phone} ariaLabel={`Copiar telefone de ${props.nickname}`} />
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

        {props.showStatusChips && (
          <>
            <hr className="m-0 border-t border-tertiary" />
            <div className="flex flex-wrap gap-2">
              {props.feeStatusChip}
              {/* Shirt data does not exist yet. Replace this with a real chip
                  once the API can answer it, as the fee chip already does. */}
              <ComingSoonChip label="Camisa · em breve" />
            </div>
          </>
        )}

        {props.attendance && (
          <>
            <hr className="m-0 border-t border-tertiary" />
            {props.attendance}
          </>
        )}
      </div>
    </Card>
  )
}
