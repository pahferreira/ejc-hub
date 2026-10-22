import clsx from 'clsx'
import type { ReactNode } from 'react'
import { FiChevronRight } from 'react-icons/fi'
import { Badge } from '../Badge/Badge'
import { AttendanceRateBar } from '../AttendanceRate/AttendanceRateBar'
import { formatMeetingDateBlock } from '../../utils/attendanceDate/attendanceDate'
import { countMeetingsOnDate, meetingSublineParts } from './meetingListFormat'
import type { AttendanceMeeting } from '../../services/attendance/attendance.types'

export type MeetingListProps = {
  meetings: AttendanceMeeting[]
  /**
   * Read-only mode (admin Team Detail, issue #283): drops the chevron and the
   * click-to-edit affordance, leaving the list as history.
   */
  readOnly?: boolean
  /** Opens a meeting to edit. Ignored in `readOnly` mode. */
  onSelectMeeting?: (meeting: AttendanceMeeting) => void
  /** Shown when there are no meetings. The page may render its own empty state instead. */
  emptyMessage?: ReactNode
}

function MeetingRowContent(props: { meeting: AttendanceMeeting; sublineParts: string[] }) {
  const { meeting } = props
  const dateBlock = formatMeetingDateBlock(meeting.heldOn)

  return (
    <>
      <div className="flex min-w-12 flex-col items-center justify-center rounded-lg bg-tertiary/40 px-2 py-1 text-dark-brown">
        <span className="text-lg leading-none font-bold">{dateBlock.day}</span>
        <span className="text-[0.65rem] font-semibold tracking-wider">{dateBlock.month}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={clsx('truncate text-dark-brown', meeting.title && 'font-bold')}>
            {meeting.title || 'Reunião'}
          </span>
          {meeting.edited && <Badge variant="info">Editada</Badge>}
        </div>
        <p className="mt-0.5 m-0 truncate text-xs text-dark-brown/60 capitalize">
          {props.sublineParts.join(' · ')}
        </p>
      </div>

      <AttendanceRateBar
        rate={meeting.rate}
        label={`Presença da reunião de ${dateBlock.day}/${dateBlock.month}`}
        align="right"
        className="w-32 shrink-0"
      />
    </>
  )
}

/**
 * The team's meeting history: one row per meeting, most recently held first.
 *
 * Shared between the coordinator board (clickable, with a chevron) and the admin
 * Team Detail (`readOnly`, issue #283). Each row carries its date block, title
 * or the plain `Reunião` fallback, an `editada` pill, the weekday/same-day/
 * justified sub-line and its rate over a band-toned Meter.
 */
export function MeetingList(props: MeetingListProps) {
  if (props.meetings.length === 0) {
    return props.emptyMessage ? <>{props.emptyMessage}</> : null
  }

  const clickable = !props.readOnly && Boolean(props.onSelectMeeting)

  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {props.meetings.map((meeting) => {
        const sublineParts = meetingSublineParts(
          meeting,
          countMeetingsOnDate(props.meetings, meeting.heldOn)
        )

        const inner = <MeetingRowContent meeting={meeting} sublineParts={sublineParts} />

        return (
          <li key={meeting.id}>
            {clickable ? (
              <button
                type="button"
                onClick={() => props.onSelectMeeting?.(meeting)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-tertiary bg-white p-3 text-left shadow-sm transition-colors hover:bg-table-highlight"
              >
                {inner}
                <FiChevronRight className="shrink-0 text-dark-brown/40" aria-hidden />
              </button>
            ) : (
              <div className="flex w-full items-center gap-3 rounded-xl border border-tertiary bg-white p-3">
                {inner}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
