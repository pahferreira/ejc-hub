import clsx from 'clsx'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MdDragIndicator } from 'react-icons/md'
import { TeamBuildingColumn } from '../../components/TeamBuildingColumn/TeamBuildingColumn'
import { DraggableMemberCard } from './DraggableMemberCard'
import type { TeamBoardColumn } from '../../services/team-building/team-building.types'

export type SortableColumnProps = {
  column: TeamBoardColumn
  /** Whether the column is over capacity after the current draft moves. */
  isOverCapacity?: boolean
}

export function SortableColumn(props: SortableColumnProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({ id: props.column.id, data: { type: 'column' } })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx(
        'w-80 shrink-0 rounded-xl transition-shadow',
        isOver && 'ring-2 ring-dark-brown ring-offset-2',
        props.isOverCapacity && 'ring-2 ring-red',
        isDragging && 'z-10 opacity-60'
      )}
    >
      <TeamBuildingColumn
        title={props.column.title}
        description={props.column.description}
        count={props.column.count}
        max={props.column.max}
        variant="default"
        dragHandle={
          <button
            type="button"
            aria-label={`Reordenar ${props.column.title}`}
            className="mt-0.5 shrink-0 cursor-grab text-secondary-foreground hover:text-dark-brown active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <MdDragIndicator aria-hidden="true" size={18} />
          </button>
        }
      >
        {props.column.members.map((member) => (
          <DraggableMemberCard key={member.userId} member={member} />
        ))}
      </TeamBuildingColumn>
    </div>
  )
}
