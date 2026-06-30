import clsx from 'clsx'
import { useDroppable } from '@dnd-kit/core'
import {
  TeamBuildingColumn,
  type TeamBuildingColumnVariant,
} from '../../components/TeamBuildingColumn/TeamBuildingColumn'
import { DraggableMemberCard } from './DraggableMemberCard'
import type { TeamBoardColumn } from '../../services/team-building/team-building.types'

export type DroppableColumnProps = {
  column: TeamBoardColumn
  /** Whether the column is over capacity after the current draft moves. */
  isOverCapacity?: boolean
}

function variantForColumn(column: TeamBoardColumn): TeamBuildingColumnVariant {
  if (column.kind === 'unassigned') {
    return 'dashed'
  }
  if (column.kind === 'waiting_list') {
    return 'transparent'
  }
  return 'default'
}

export function DroppableColumn(props: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: props.column.id })

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'w-80 shrink-0 rounded-xl transition-shadow',
        isOver && 'ring-2 ring-dark-brown ring-offset-2',
        props.isOverCapacity && 'ring-2 ring-red'
      )}
    >
      <TeamBuildingColumn
        title={props.column.title}
        description={props.column.description}
        count={props.column.count}
        max={props.column.max}
        variant={variantForColumn(props.column)}
      >
        {props.column.members.map((member) => (
          <DraggableMemberCard key={member.userId} member={member} />
        ))}
      </TeamBuildingColumn>
    </div>
  )
}
