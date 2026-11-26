import type { ScheduleActivityNote } from '../../services/schedule/schedule.types'
import { noteAuthorLine } from '../../utils/scheduleNote/scheduleNote'

export type ScheduleActivityNotesProps = {
  /** The notes the viewer may read, oldest first. Nothing renders without any. */
  notes: ScheduleActivityNote[]
}

/**
 * An activity's Observações, stacked in creation order under its row: each in
 * the yellow "Nota: …" box, with its author, their role and the time it was left.
 */
export function ScheduleActivityNotes(props: ScheduleActivityNotesProps) {
  if (props.notes.length === 0) {
    return null
  }

  return (
    <ul aria-label="Notas" className="m-0 flex list-none flex-col gap-2 p-0">
      {props.notes.map((note) => (
        <li
          key={note.id}
          className="flex flex-col gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2"
        >
          <p className="m-0 whitespace-pre-line break-words text-sm text-dark-brown">
            <span className="font-semibold">Nota:</span> {note.body}
          </p>
          <p className="m-0 text-xs text-gray-600">{noteAuthorLine(note)}</p>
        </li>
      ))}
    </ul>
  )
}
