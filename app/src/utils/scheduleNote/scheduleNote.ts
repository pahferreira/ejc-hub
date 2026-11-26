import { toEventTime } from '../../../../common/schedule/toEventTime'
import type { ScheduleActivityNote } from '../../services/schedule/schedule.types'

const ROLE_LABEL: Record<ScheduleActivityNote['authorRole'], string> = {
  admin: 'administração',
  coordinator: 'coordenação',
}

/** A note's author line: "Ana (coordenação) · 14:32", the time on the São Paulo clock. */
export function noteAuthorLine(note: ScheduleActivityNote): string {
  return `${note.authorName} (${ROLE_LABEL[note.authorRole]}) · ${toEventTime(new Date(note.createdAt))}`
}
