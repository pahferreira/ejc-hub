import {
  isHeldBeforeJoin,
  toMemberAttendanceRate,
  toPooledAttendanceRate,
} from './attendance-rate.ts'
import type { AttendanceRowInput, MeetingInput } from './coordinator-read-model.ts'
import type {
  MemberAttendanceMeeting,
  MemberAttendanceReadModel,
} from '../domain/attendance.types.ts'

/**
 * Assembles the member Reuniões read model from the team's meetings and every
 * attendance row.
 *
 * Every row comes in because each meeting's team rate pools them, but only the
 * caller's own rows come out: other people are reduced to that per-meeting
 * aggregate, so the response cannot carry anyone else's rate or status.
 */
export function buildMemberReadModel(input: {
  teamInstanceId: string
  userId: string
  joinedAt: Date
  meetings: MeetingInput[]
  attendanceRows: AttendanceRowInput[]
}): MemberAttendanceReadModel {
  const { teamInstanceId, userId, joinedAt, meetings, attendanceRows } = input

  const rowsByMeeting = new Map<string, AttendanceRowInput[]>()
  const ownRowByMeeting = new Map<string, AttendanceRowInput>()
  for (const row of attendanceRows) {
    const meetingRows = rowsByMeeting.get(row.meetingId) ?? []
    meetingRows.push(row)
    rowsByMeeting.set(row.meetingId, meetingRows)

    if (row.userId === userId) {
      ownRowByMeeting.set(row.meetingId, row)
    }
  }

  const rate = toMemberAttendanceRate(
    joinedAt,
    [...ownRowByMeeting.values()].map((row) => ({ heldOn: row.heldOn, status: row.status }))
  )

  const memberMeetings: MemberAttendanceMeeting[] = meetings.map((meeting) => {
    // No own row means the meeting was registered before the caller was on the
    // roster: before their entry too, even when held on or after the join day.
    // A row dated before the join day is skipped by the rate, so it is too.
    const ownRow = ownRowByMeeting.get(meeting.id)
    const beforeJoin = !ownRow || isHeldBeforeJoin(meeting.heldOn, joinedAt)
    const countedOwnRow = beforeJoin ? undefined : ownRow

    return {
      id: meeting.id,
      heldOn: meeting.heldOn,
      title: meeting.title,
      teamRate: toPooledAttendanceRate(
        (rowsByMeeting.get(meeting.id) ?? []).map((row) => row.status)
      ),
      beforeJoin,
      status: countedOwnRow?.status ?? null,
      justificationReason: countedOwnRow?.justificationReason ?? null,
    }
  })

  return { teamInstanceId, joinedAt, rate, meetings: memberMeetings }
}
