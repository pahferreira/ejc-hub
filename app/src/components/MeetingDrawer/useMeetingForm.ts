import { useCallback, useMemo, useState } from 'react'
import { usePostHog } from '@posthog/react'
import { useRegisterMeetingMutation } from '../../services/attendance/useRegisterMeetingMutation'
import { useUpdateMeetingMutation } from '../../services/attendance/useUpdateMeetingMutation'
import { useDeleteMeetingMutation } from '../../services/attendance/useDeleteMeetingMutation'
import { useMyTeamQuery } from '../../services/teams/useMyTeamQuery'
import type {
  AttendanceMeeting,
  AttendanceRosterMember,
} from '../../services/attendance/attendance.types'
import { formatMeetingDateBlock, todayInSaoPaulo } from '../../utils/attendanceDate/attendanceDate'
import { toastPromise } from '../../utils/toast/toast'
import {
  clearJustification,
  filterRoster,
  groupRoster,
  initialMeetingForm,
  justify,
  markAll,
  meetingFormFromMeeting,
  meetingRoster,
  rowReason,
  rowStatus,
  setPresent,
  setReason,
  tallyAttendance,
  toMeetingBody,
  validateMeetingForm,
  type MeetingForm,
} from './meetingForm'

// What the delete confirmation calls the meeting, as the list row does: its
// title, or the plain `Reunião` fallback with its date.
function meetingLabel(meeting: AttendanceMeeting): string {
  if (meeting.title) {
    return meeting.title
  }

  const { day, month } = formatMeetingDateBlock(meeting.heldOn)
  return `a reunião de ${day} ${month}`
}

/** The one attendance event PostHog receives. */
const MEETING_REGISTERED_EVENT = 'action-meeting-registered'

/**
 * The meeting drawer: open state, the form, search, the save and the delete.
 *
 * `openNew` registers a meeting against the current roster; `openEdit` loads a
 * meeting and lists its own rows instead, so removed members stay correctable
 * and later joiners never appear. Errors stay hidden until the first save
 * attempt, then track every edit, so a fresh drawer doesn't open on a wall of red.
 */
export function useMeetingForm(roster: AttendanceRosterMember[]) {
  const posthog = usePostHog()
  const teamQuery = useMyTeamQuery()
  const registerMutation = useRegisterMeetingMutation()
  const updateMutation = useUpdateMeetingMutation()
  const deleteMutation = useDeleteMeetingMutation()

  const [isOpen, setIsOpen] = useState(false)
  // The meeting being edited, or null when registering a new one.
  const [editing, setEditing] = useState<AttendanceMeeting | null>(null)
  const [form, setForm] = useState<MeetingForm>(() => initialMeetingForm(todayInSaoPaulo()))
  const [search, setSearch] = useState('')
  const [showErrors, setShowErrors] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  const today = todayInSaoPaulo()

  const openWith = useCallback((nextForm: MeetingForm, meeting: AttendanceMeeting | null) => {
    setForm(nextForm)
    setEditing(meeting)
    setSearch('')
    setShowErrors(false)
    setIsConfirmingDelete(false)
    setIsOpen(true)
  }, [])

  const openNew = useCallback(
    () => openWith(initialMeetingForm(todayInSaoPaulo()), null),
    [openWith]
  )
  const openEdit = useCallback(
    (meeting: AttendanceMeeting) => openWith(meetingFormFromMeeting(meeting), meeting),
    [openWith]
  )

  const close = useCallback(() => setIsOpen(false), [])

  const drawerRoster = useMemo(
    () => (editing ? meetingRoster(editing, roster) : roster),
    [editing, roster]
  )
  const visibleRoster = useMemo(() => filterRoster(drawerRoster, search), [drawerRoster, search])
  const groups = useMemo(() => groupRoster(visibleRoster), [visibleRoster])
  const tally = tallyAttendance(form, drawerRoster)
  const validation = validateMeetingForm(form, drawerRoster, today)

  const visibleIds = visibleRoster.map((member) => member.userId)
  const allVisiblePresent =
    visibleIds.length > 0 && visibleIds.every((userId) => rowStatus(form, userId) === 'present')

  const toggleAll = () => setForm((current) => markAll(current, visibleIds, !allVisiblePresent))

  const save = () => {
    if (!validation.isValid) {
      setShowErrors(true)
      return
    }

    const body = toMeetingBody(form, drawerRoster)

    if (editing) {
      const pending = updateMutation
        .mutateAsync({ meetingId: editing.id, body })
        .then(() => setIsOpen(false))

      toastPromise(pending, { message: 'Reunião atualizada com sucesso!' })
      return
    }

    const teamKey = teamQuery.data?.templateKey

    const pending = registerMutation.mutateAsync(body).then((result) => {
      posthog.capture(MEETING_REGISTERED_EVENT, {
        teamKey,
        attendeeCount: result.attendeeCount,
        justifiedCount: result.justifiedCount,
      })
      setIsOpen(false)
    })

    toastPromise(pending, { message: 'Reunião registrada com sucesso!' })
  }

  const confirmDelete = () => {
    if (!editing) {
      return
    }

    const pending = deleteMutation.mutateAsync(editing.id).then(() => {
      setIsConfirmingDelete(false)
      setIsOpen(false)
    })

    toastPromise(pending, { message: 'Reunião excluída com sucesso!' })
  }

  return {
    isOpen,
    isEditing: editing !== null,
    openNew,
    openEdit,
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
    totalCount: drawerRoster.length,
    tally,
    errors: showErrors ? validation : { isValid: true, reasons: {} },
    save,
    isSaving: registerMutation.isPending || updateMutation.isPending,
    meetingLabel: editing ? meetingLabel(editing) : '',
    isConfirmingDelete,
    requestDelete: () => setIsConfirmingDelete(true),
    cancelDelete: () => setIsConfirmingDelete(false),
    confirmDelete,
    isDeleting: deleteMutation.isPending,
  }
}
