import { Transition } from '@headlessui/react'
import clsx from 'clsx'
import { useState } from 'react'
import { FiChevronDown } from 'react-icons/fi'
import { Badge } from '../Badge/Badge'
import { RateSummary } from '../AttendanceRate/RateSummary'
import {
  formatMeetingDateBlock,
  formatMeetingWeekday,
} from '../../utils/attendanceDate/attendanceDate'
import { formatTeamMeetingRate, statusToBadge } from './memberAttendanceFormat'
import type {
  MemberAttendanceMeeting,
  MemberAttendanceReadModel,
} from '../../services/attendance/attendance.types'
import { Button } from '../Button/Button'

export type MemberAttendanceHistoryProps = {
  model: MemberAttendanceReadModel
}

function MemberMeetingRow(props: { meeting: MemberAttendanceMeeting }) {
  const { meeting } = props
  const [isReasonOpen, setIsReasonOpen] = useState(false)
  const dateBlock = formatMeetingDateBlock(meeting.heldOn)
  const badge = meeting.status ? statusToBadge(meeting.status) : null
  const reason = meeting.status === 'justified' ? meeting.justificationReason : null

  return (
    <li
      className={clsx(
        'rounded-xl border border-tertiary p-3',
        meeting.beforeJoin ? 'bg-tertiary/10 opacity-60' : 'bg-white'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex min-w-12 flex-col items-center justify-center rounded-lg bg-tertiary/40 px-2 py-1 text-dark-brown">
          <span className="text-lg leading-none font-bold">{dateBlock.day}</span>
          <span className="text-[0.65rem] font-semibold tracking-wider">{dateBlock.month}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={clsx('truncate text-dark-brown', meeting.title && 'font-bold')}>
              {meeting.title || 'Reunião'}
            </span>
            {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
          </div>
          <p className="capitalize mt-0.5 m-0 truncate text-xs text-dark-brown/60">
            {meeting.beforeJoin
              ? 'antes da sua entrada · não conta'
              : formatMeetingWeekday(meeting.heldOn)}
          </p>
          {reason && (
            <Button
              size="small"
              variant="text"
              onClick={() => setIsReasonOpen((open) => !open)}
              aria-expanded={isReasonOpen}
            >
              Ver justificativa
              <FiChevronDown
                aria-hidden
                className={clsx('transition-transform', isReasonOpen && 'rotate-180')}
              />
            </Button>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end text-right">
          <span className="text-[0.65rem] font-semibold tracking-wider text-dark-brown/60">
            EQUIPE
          </span>
          <span className="text-sm font-medium text-dark-brown">
            {formatTeamMeetingRate(meeting.teamRate)}
          </span>
        </div>
      </div>

      {/* Animating grid rows 0fr -> 1fr grows the row smoothly; height: auto can't transition. */}
      {reason && (
        <Transition show={isReasonOpen}>
          <div className="grid grid-rows-[1fr] transition-all duration-200 ease-out data-closed:grid-rows-[0fr] data-closed:opacity-0 motion-reduce:transition-none">
            <div className="overflow-hidden">
              <p className="mt-3 mb-0 rounded-lg bg-blue/10 px-3 py-2 text-sm text-dark-brown">
                {reason}
              </p>
            </div>
          </div>
        </Transition>
      )}
    </li>
  )
}

/**
 * "Histórico de presença": a member's own record on the Reuniões page.
 *
 * Every team meeting with the member's own status beside the team's rate for
 * it. Nobody else's rate or status reaches this component — the API never sends
 * them. Meetings from before the member joined are greyed out and don't count.
 */
export function MemberAttendanceHistory(props: MemberAttendanceHistoryProps) {
  const { model } = props
  const hasMeetings = model.meetings.length > 0

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="m-0 text-xl font-semibold text-dark-brown">Histórico de presença</h2>
        {/* With no meetings the empty state already says it; the summary would repeat it. */}
        {hasMeetings && <RateSummary label="Sua presença" rate={model.rate} />}
      </div>

      {hasMeetings ? (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {model.meetings.map((meeting) => (
            <MemberMeetingRow key={meeting.id} meeting={meeting} />
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-tertiary bg-white px-6 py-12 text-center">
          <p className="m-0 text-sm text-gray-600">Sem reuniões desde a entrada</p>
        </div>
      )}
    </section>
  )
}
