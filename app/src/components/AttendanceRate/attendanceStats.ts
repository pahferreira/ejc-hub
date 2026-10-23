import { formatRateFraction } from './attendanceRate'
import type {
  AttendanceRate,
  CoordinatorAttendanceReadModel,
} from '../../services/attendance/attendance.types'

export type AttendanceStat = { value: string | number; description: string }

/**
 * The Média card's value and line. The value slot is large, so it holds the
 * percentage alone and the fraction moves to the description.
 */
export function teamAverageStat(rate: AttendanceRate): AttendanceStat {
  if (rate.band === 'no-meetings') {
    return { value: '-', description: 'Nenhuma reunião registrada' }
  }

  const fraction = formatRateFraction(rate)
  const description =
    rate.band === 'insufficient-data' ? `${fraction} · poucos dados` : `${fraction} presenças`

  return { value: `${rate.percentage}%`, description }
}

/** The Justificadas card: the count, then `de 115 · 3%` over every row. */
export function justifiedStat(
  model: Pick<CoordinatorAttendanceReadModel, 'justifiedTotal' | 'totalRows'>
): AttendanceStat {
  const percentage =
    model.totalRows > 0 ? Math.round((model.justifiedTotal / model.totalRows) * 100) : 0

  return { value: model.justifiedTotal, description: `de ${model.totalRows} · ${percentage}%` }
}
