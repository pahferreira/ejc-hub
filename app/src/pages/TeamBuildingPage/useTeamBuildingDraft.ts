import { useEffect, useMemo, useState } from 'react'
import type {
  AssignmentChange,
  AssignmentTarget,
  TeamBoard,
  TeamBoardColumn,
} from '../../services/team-building/team-building.types'

/** Maps a destination column id back to the assignment target the API expects. */
function columnIdToTarget(columnId: string): AssignmentTarget {
  if (columnId === 'unassigned') {
    return { kind: 'unassigned' }
  }
  if (columnId === 'waiting_list') {
    return { kind: 'waiting_list' }
  }
  return { kind: 'team', teamInstanceId: columnId }
}

/**
 * Overlays local member moves on top of the server board. Moves are kept as a
 * map of userId -> destination column id; the effective board and the diff sent
 * to the API are both derived from that overlay.
 */
export function useTeamBuildingDraft(board: TeamBoard | undefined) {
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  // User ids in the order they were last moved, most recent first. Drives the
  // "dropped card goes to the top of its column" ordering.
  const [moveOrder, setMoveOrder] = useState<string[]>([])

  // A fresh server board (initial load or post-save) becomes the new baseline.
  useEffect(() => {
    setOverrides({})
    setMoveOrder([])
  }, [board])

  const originalColumnByUser = useMemo(() => {
    const map = new Map<string, string>()
    board?.columns.forEach((column) => {
      column.members.forEach((member) => map.set(member.userId, column.id))
    })
    return map
  }, [board])

  const columns = useMemo<TeamBoardColumn[]>(() => {
    if (!board) {
      return []
    }

    const membersByColumn = new Map<string, TeamBoardColumn['members']>(
      board.columns.map((column) => [column.id, []])
    )

    board.columns.forEach((column) => {
      column.members.forEach((member) => {
        const target = overrides[member.userId] ?? column.id
        const bucket = membersByColumn.get(target) ?? membersByColumn.get(column.id)!
        bucket.push(member)
      })
    })

    const moveRank = new Map(moveOrder.map((userId, index) => [userId, index]))

    return board.columns.map((column) => {
      const bucket = membersByColumn.get(column.id) ?? []
      // Members dropped into this column float to the top, most recent first;
      // the column's existing members keep their order below them.
      const movedIn = bucket
        .filter((member) => overrides[member.userId] === column.id)
        .sort((a, b) => (moveRank.get(a.userId) ?? 0) - (moveRank.get(b.userId) ?? 0))
      const existing = bucket.filter((member) => overrides[member.userId] === undefined)
      const members = [...movedIn, ...existing]
      return { ...column, members, count: members.length }
    })
  }, [board, overrides, moveOrder])

  const moveMember = (userId: string, toColumnId: string) => {
    const original = originalColumnByUser.get(userId)
    const returnedHome = toColumnId === original
    setOverrides((current) => {
      const next = { ...current }
      if (returnedHome) {
        delete next[userId]
      } else {
        next[userId] = toColumnId
      }
      return next
    })
    setMoveOrder((current) => {
      const without = current.filter((id) => id !== userId)
      // Returning a card to its origin clears its move; otherwise it becomes the
      // most recently moved (top of the column).
      return returnedHome ? without : [userId, ...without]
    })
  }

  const reset = () => {
    setOverrides({})
    setMoveOrder([])
  }

  const diff = (): AssignmentChange[] =>
    Object.entries(overrides).map(([userId, columnId]) => ({
      userId,
      target: columnIdToTarget(columnId),
    }))

  const isDirty = Object.keys(overrides).length > 0

  return { columns, isDirty, moveMember, reset, diff }
}
