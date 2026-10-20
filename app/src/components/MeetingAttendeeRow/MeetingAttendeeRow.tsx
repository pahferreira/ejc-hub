import { FiX } from 'react-icons/fi'
import { Badge } from '../Badge/Badge'
import { Checkbox } from '../Checkbox/Checkbox'
import { Input } from '../Input/Input'
import { UserAvatar } from '../UserAvatar/UserAvatar'
import type { MeetingAttendanceStatus } from '../../services/attendance/attendance.types'

type MeetingAttendeeRowProps = {
  userId: string
  name: string
  nickname: string
  pictureUrl: string | null
  isCoordinator?: boolean
  status: MeetingAttendanceStatus
  reason: string
  reasonError?: string
  onPresentChange: (present: boolean) => void
  onJustify: () => void
  onClearJustification: () => void
  onReasonChange: (reason: string) => void
}

/**
 * One roster row in the Registrar reunião drawer.
 *
 * Unticked rows read `Ausente` with a Justificar link; a justified row swaps
 * that for a badge and an inline, required reason. Ticking a justified row
 * marks it present — one status per row.
 */
export function MeetingAttendeeRow(props: MeetingAttendeeRowProps) {
  const isJustified = props.status === 'justified'

  return (
    <div className="rounded-lg px-3 py-2 hover:bg-secondary/20">
      <div className="flex items-center gap-3">
        <Checkbox
          label={`Marcar ${props.name} como presente`}
          hideLabel
          checked={props.status === 'present'}
          onChange={props.onPresentChange}
        />
        <UserAvatar name={props.name} pictureUrl={props.pictureUrl} size="small" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-dark-brown">{props.nickname}</span>
            {props.isCoordinator && <Badge>Coord.</Badge>}
          </div>
          <p className="m-0 truncate text-xs text-dark-brown/60">{props.name}</p>
        </div>

        {props.status === 'present' && <Badge variant="success">Presente</Badge>}

        {props.status === 'absent' && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-dark-brown/60">Ausente</span>
            <button
              type="button"
              onClick={props.onJustify}
              className="font-semibold text-primary underline hover:cursor-pointer"
            >
              Justificar
            </button>
          </div>
        )}

        {isJustified && (
          <div className="flex items-center gap-1">
            <Badge variant="warning">Justificada</Badge>
            <button
              type="button"
              onClick={props.onClearJustification}
              aria-label={`Remover justificativa de ${props.name}`}
              className="rounded-md p-1 text-dark-brown/60 hover:cursor-pointer hover:text-dark-brown"
            >
              <FiX size={14} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {isJustified && (
        <div className="mt-2 pl-7">
          <Input
            label="Justificativa"
            name={`justification-${props.userId}`}
            isRequired
            placeholder="Por que não pôde vir?"
            value={props.reason}
            onChange={props.onReasonChange}
            error={props.reasonError}
          />
        </div>
      )}
    </div>
  )
}
