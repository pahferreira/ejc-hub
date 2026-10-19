import { Badge } from '../Badge/Badge'
import type { AttendanceBand } from '../../services/attendance/attendance.types'
import { bandToBadge } from './attendanceRate'

export type SituacaoBadgeProps = {
  band: AttendanceBand
}

/**
 * The Boa / Em risco / Precisa substituir badge, or nothing for the two edge
 * states (`insufficient-data`, `no-meetings`), matching the Membros table's
 * Situação column.
 */
export function SituacaoBadge(props: SituacaoBadgeProps) {
  const badge = bandToBadge(props.band)

  if (!badge) {
    return null
  }

  return <Badge variant={badge.variant}>{badge.label}</Badge>
}
