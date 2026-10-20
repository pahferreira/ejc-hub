import { useCallback, useMemo, useState } from 'react'
import { usePostHog } from '@posthog/react'
import { useRegisterMeetingMutation } from '../../services/attendance/useRegisterMeetingMutation'
import { useMyTeamQuery } from '../../services/teams/useMyTeamQuery'
import type { AttendanceRosterMember } from '../../services/attendance/attendance.types'
import { todayInSaoPaulo } from '../../utils/attendanceDate/attendanceDate'
import { toastPromise } from '../../utils/toast/toast'
import {
  clearJustification,
  filterRoster,
  groupRoster,
  initialMeetingForm,
  justify,
  markAll,
  rowReason,
  rowStatus,
  setPresent,
  setReason,
  tallyAttendance,
  toRegisterMeetingBody,
  validateMeetingForm,
  type MeetingForm,
} from './registerMeetingForm'

/** The one attendance event PostHog receives. */
const MEETING_REGISTERED_EVENT = 'action-meeting-registered'

/**
 * The Registrar reunião drawer: open state, the form, search and the save.
 *
 * Errors stay hidden until the first save attempt, then track every edit, so
 * a fresh drawer doesn't open on a wall of red.
 */
export function useRegisterMeetingForm(roster: AttendanceRosterMember[]) {
  const posthog = usePostHog()
  const teamQuery = useMyTeamQuery()
  const mutation = useRegisterMeetingMutation()

  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState<MeetingForm>(() => initialMeetingForm(todayInSaoPaulo()))
  const [search, setSearch] = useState('')
  const [showErrors, setShowErrors] = useState(false)

  const today = todayInSaoPaulo()

  const open = useCallback(() => {
    setForm(initialMeetingForm(todayInSaoPaulo()))
    setSearch('')
    setShowErrors(false)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => setIsOpen(false), [])

  const visibleRoster = useMemo(() => filterRoster(roster, search), [roster, search])
  const groups = useMemo(() => groupRoster(visibleRoster), [visibleRoster])
  const tally = tallyAttendance(form, roster)
  const validation = validateMeetingForm(form, roster, today)

  const visibleIds = visibleRoster.map((member) => member.userId)
  const allVisiblePresent =
    visibleIds.length > 0 && visibleIds.every((userId) => rowStatus(form, userId) === 'present')

  const toggleAll = () => setForm((current) => markAll(current, visibleIds, !allVisiblePresent))

  const save = () => {
    if (!validation.isValid) {
      setShowErrors(true)
      return
    }

    const body = toRegisterMeetingBody(form, roster)
    const teamKey = teamQuery.data?.templateKey

    const pending = mutation.mutateAsync(body).then((result) => {
      posthog.capture(MEETING_REGISTERED_EVENT, {
        teamKey,
        attendeeCount: result.attendeeCount,
        justifiedCount: result.justifiedCount,
      })
      setIsOpen(false)
    })

    toastPromise(pending, { message: 'Reunião registrada com sucesso!' })
  }

  return {
    isOpen,
    open,
    close,
    form,
    setHeldOn: (heldOn: string) => setForm((current) => ({ ...current, heldOn })),
    setTitle: (title: string) => setForm((current) => ({ ...current, title })),
    setDescription: (description: string) => setForm((current) => ({ ...current, description })),
    statusOf: (userId: string) => rowStatus(form, userId),
    reasonOf: (userId: string) => rowReason(form, userId),
    setPresent: (userId: string, present: boolean) =>
      setForm((current) => setPresent(current, userId, present)),
    justify: (userId: string) => setForm((current) => justify(current, userId)),
    clearJustification: (userId: string) =>
      setForm((current) => clearJustification(current, userId)),
    setReason: (userId: string, reason: string) =>
      setForm((current) => setReason(current, userId, reason)),
    search,
    setSearch,
    groups,
    allVisiblePresent,
    toggleAll,
    today,
    totalCount: roster.length,
    tally,
    errors: showErrors ? validation : { isValid: true, reasons: {} },
    save,
    isSaving: mutation.isPending,
  }
}
