import { describe, it, expect } from 'vitest'
import { justifiedStat, teamAverageStat } from './attendanceStats'
import type { AttendanceRate } from '../../services/attendance/attendance.types'

function rate(overrides: Partial<AttendanceRate>): AttendanceRate {
  return {
    present: 0,
    eligible: 0,
    justified: 0,
    percentage: null,
    band: 'no-meetings',
    ...overrides,
  }
}

describe('justifiedStat', () => {
  it('reads the count over every row with its rounded share, like 4 de 115 · 3%', () => {
    expect(justifiedStat({ justifiedTotal: 4, totalRows: 115 })).toEqual({
      value: 4,
      description: 'de 115 · 3%',
    })
  })

  it('reads 0% rather than dividing by zero when no meeting has been registered', () => {
    expect(justifiedStat({ justifiedTotal: 0, totalRows: 0 })).toEqual({
      value: 0,
      description: 'de 0 · 0%',
    })
  })
})

describe('teamAverageStat', () => {
  it('shows the pooled percentage with the fraction of presences beneath', () => {
    const average = rate({ present: 13, eligible: 17, percentage: 76, band: 'good' })

    expect(teamAverageStat(average)).toEqual({ value: '76%', description: '13/17 presenças' })
  })

  it('flags too few meetings to band', () => {
    const average = rate({ present: 1, eligible: 1, percentage: 100, band: 'insufficient-data' })

    expect(teamAverageStat(average)).toEqual({ value: '100%', description: '1/1 · poucos dados' })
  })

  it('shows a dash when the team has registered no meetings', () => {
    expect(teamAverageStat(rate({}))).toEqual({
      value: '-',
      description: 'Nenhuma reunião registrada',
    })
  })
})
