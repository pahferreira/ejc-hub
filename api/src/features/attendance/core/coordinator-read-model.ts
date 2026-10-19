import { resolveNickname } from '../../../shared/resolve-nickname.ts'
import type { MeetingAttendanceStatus } from '../../../modules/meeting-attendance/domain/meeting-attendance-status.ts'
import { toMemberAttendanceRate, toPooledAttendanceRate } from './attendance-rate.ts'
import type {
  AttendanceBand,
  AttendanceBandCounts,
  AttendanceMeeting,
  AttendanceRosterMember,
  CoordinatorAttendanceReadModel,
  MeetingAttendanceEntry,
} from '../domain/attendance.types.ts'

/** A current roster member, straight from `team_memberships` joined to `users`. */
export type RosterMemberInput = {
  userId: string
  name: string
  nickname: string | null
  pictureUrl: string | null
  type: 'member' | 'coordinator'
  joinedAt: Date
}

/** One registered meeting, with the timestamps the `edited` flag reads. */
export type MeetingInput = {
  id: string
  heldOn: string
  title: string | null
  description: string | null
  createdAt: Date
  updatedAt: Date
}

/** One attendance row, joined to its meeting's date and the person it names. */
export type AttendanceRowInput = {
  meetingId: string
  heldOn: string
  userId: string
  name: string
  nickname: string | null
  pictureUrl: string | null
  status: MeetingAttendanceStatus
  justificationReason: string | null
}

const EMPTY_BAND_COUNTS: AttendanceBandCounts = {
  good: 0,
  risky: 0,
  'needs-replacement': 0,
  'insufficient-data': 0,
  'no-meetings': 0,
}

function toEntry(row: AttendanceRowInput): MeetingAttendanceEntry {
  return {
    userId: row.userId,
    name: row.name,
    nickname: resolveNickname(row.name, row.nickname),
    pictureUrl: row.pictureUrl,
    status: row.status,
    justificationReason: row.justificationReason,
  }
}

/**
 * Assembles the coordinator Reuniões read model from a team's roster, meetings
 * and every attendance row.
 *
 * The Média is **pooled** over every row — not the mean of the members'
 * percentages — so a newcomer's single row weighs one row, not one person. Each
 * member's own rate pro-rates from their join date, so a removed member's rows
 * (which point at `users` and outlive their membership) still feed the pooled
 * Média and each meeting's rate, yet never touch a remaining member's rate: the
 * removed person is simply not on the roster the rates are built from.
 */
export function buildCoordinatorReadModel(input: {
  teamInstanceId: string
  roster: RosterMemberInput[]
  meetings: MeetingInput[]
  attendanceRows: AttendanceRowInput[]
}): CoordinatorAttendanceReadModel {
  const { teamInstanceId, roster, meetings, attendanceRows } = input

  const teamAverage = toPooledAttendanceRate(attendanceRows.map((row) => row.status))
  const justifiedTotal = attendanceRows.filter((row) => row.status === 'justified').length

  const rowsByUser = new Map<string, AttendanceRowInput[]>()
  const rowsByMeeting = new Map<string, AttendanceRowInput[]>()
  for (const row of attendanceRows) {
    const userRows = rowsByUser.get(row.userId) ?? []
    userRows.push(row)
    rowsByUser.set(row.userId, userRows)

    const meetingRows = rowsByMeeting.get(row.meetingId) ?? []
    meetingRows.push(row)
    rowsByMeeting.set(row.meetingId, meetingRows)
  }

  const bandCounts: AttendanceBandCounts = { ...EMPTY_BAND_COUNTS }

  const rosterMembers: AttendanceRosterMember[] = roster.map((member) => {
    const records = (rowsByUser.get(member.userId) ?? []).map((row) => ({
      heldOn: row.heldOn,
      status: row.status,
    }))
    const rate = toMemberAttendanceRate(member.joinedAt, records)
    bandCounts[rate.band] += 1

    return {
      userId: member.userId,
      name: member.name,
      nickname: resolveNickname(member.name, member.nickname),
      pictureUrl: member.pictureUrl,
      type: member.type,
      joinedAt: member.joinedAt,
      rate,
    }
  })

  const attendanceMeetings: AttendanceMeeting[] = meetings.map((meeting) => {
    const meetingRows = rowsByMeeting.get(meeting.id) ?? []

    return {
      id: meeting.id,
      heldOn: meeting.heldOn,
      title: meeting.title,
      description: meeting.description,
      edited: meeting.updatedAt.getTime() > meeting.createdAt.getTime(),
      rate: toPooledAttendanceRate(meetingRows.map((row) => row.status)),
      attendances: meetingRows.map(toEntry),
    }
  })

  return {
    teamInstanceId,
    teamAverage,
    meetingCount: meetings.length,
    totalRows: attendanceRows.length,
    justifiedTotal,
    bandCounts,
    roster: rosterMembers,
    meetings: attendanceMeetings,
  }
}
