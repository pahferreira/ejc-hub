import { useMemo, useState } from 'react'
import { Table } from '../Table'
import { UserAvatar } from '../UserAvatar/UserAvatar'
import { AttendanceRateBar } from '../AttendanceRate/AttendanceRateBar'
import { SituacaoBadge } from '../AttendanceRate/SituacaoBadge'
import { formatJoinDay, joinedAfterFirstMeeting } from '../../utils/attendanceDate/attendanceDate'
import {
  sortRosterMembers,
  type MemberSortDirection,
  type MemberSortKey,
} from './membersAttendanceSort'
import type { AttendanceRosterMember } from '../../services/attendance/attendance.types'

export type MembersAttendanceTableProps = {
  members: AttendanceRosterMember[]
  /** The earliest meeting's `held_on`; drives the `entrou em DD/MM` note. */
  firstMeetingHeldOn?: string
}

function MemberIdentity(props: { member: AttendanceRosterMember; firstMeetingHeldOn?: string }) {
  const { member } = props
  const joinedLate = joinedAfterFirstMeeting(member.joinedAt, props.firstMeetingHeldOn)

  return (
    <div className="flex items-center gap-3">
      <UserAvatar name={member.name} pictureUrl={member.pictureUrl} />
      <div className="min-w-0">
        <p className="m-0 truncate font-medium text-dark-brown">{member.nickname}</p>
        <p className="m-0 truncate text-xs text-dark-brown/60">{member.name}</p>
        {joinedLate && (
          <p className="m-0 text-xs text-dark-brown/60">
            entrou em {formatJoinDay(member.joinedAt)}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * The Membros table: each team member with their rate and Situação.
 *
 * Pessoa and Presença are sortable; the default is Presença ascending, so the
 * people most at risk sit at the top. Situação shows a Boa / Em risco / Precisa
 * substituir badge, or nothing for the two edge states.
 */
export function MembersAttendanceTable(props: MembersAttendanceTableProps) {
  const [sortKey, setSortKey] = useState<MemberSortKey>('presenca')
  const [direction, setDirection] = useState<MemberSortDirection>('asc')

  const sorted = useMemo(
    () => sortRosterMembers(props.members, sortKey, direction),
    [props.members, sortKey, direction]
  )

  const handleSort = (key: MemberSortKey) => () => {
    if (key === sortKey) {
      setDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(key)
    setDirection('asc')
  }

  const directionFor = (key: MemberSortKey) => (sortKey === key ? direction : false)
  const isEmpty = sorted.length === 0

  return (
    <section className="w-full overflow-hidden rounded-xl border border-tertiary bg-white shadow-md">
      <ul className="m-0 list-none divide-y divide-gray-200 p-0 md:hidden">
        {isEmpty ? (
          <li className="px-6 py-4 text-sm text-dark-brown">Nenhum membro na equipe.</li>
        ) : (
          sorted.map((member) => (
            <li key={member.userId} className="flex flex-col gap-2 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <MemberIdentity member={member} firstMeetingHeldOn={props.firstMeetingHeldOn} />
                <SituacaoBadge band={member.rate.band} />
              </div>
              <AttendanceRateBar rate={member.rate} label={`Presença de ${member.nickname}`} />
            </li>
          ))
        )}
      </ul>

      <div className="hidden md:block">
        <Table bordered={false}>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell
                sortDirection={directionFor('pessoa')}
                onSort={handleSort('pessoa')}
              >
                Pessoa
              </Table.HeaderCell>
              <Table.HeaderCell
                sortDirection={directionFor('presenca')}
                onSort={handleSort('presenca')}
              >
                Presença
              </Table.HeaderCell>
              <Table.HeaderCell>Situação</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isEmpty ? (
              <Table.Row>
                <Table.Cell colSpan={3}>Nenhum membro na equipe.</Table.Cell>
              </Table.Row>
            ) : (
              sorted.map((member) => (
                <Table.Row key={member.userId}>
                  <Table.Cell>
                    <MemberIdentity member={member} firstMeetingHeldOn={props.firstMeetingHeldOn} />
                  </Table.Cell>
                  <Table.Cell className="w-48">
                    <AttendanceRateBar
                      rate={member.rate}
                      label={`Presença de ${member.nickname}`}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <SituacaoBadge band={member.rate.band} />
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
      </div>
    </section>
  )
}
