import { useDraggable } from '@dnd-kit/core'
import { MemberCard } from './MemberCard'
import type { TeamBoardMember } from '../../services/team-building/team-building.types'

export type DraggableMemberCardProps = {
  member: TeamBoardMember
}

export function DraggableMemberCard(props: DraggableMemberCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: props.member.userId,
    data: { type: 'member' },
  })

  // The moving card is rendered by the DragOverlay; the source just dims in place.
  return (
    <div
      ref={setNodeRef}
      className={isDragging ? 'opacity-40' : undefined}
      {...listeners}
      {...attributes}
    >
      <MemberCard member={props.member} />
    </div>
  )
}
