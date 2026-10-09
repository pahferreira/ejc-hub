import { describe, expect, it } from 'vitest'
import { approveButtonLabel } from './approveRequestSummary'

describe('approveButtonLabel', () => {
  it('is a plain "Aprovar" when nothing else is closed', () => {
    expect(approveButtonLabel(0)).toBe('Aprovar')
  })

  it('names how many rival requests the approval closes', () => {
    expect(approveButtonLabel(1)).toBe('Aprovar e encerrar 1')
    expect(approveButtonLabel(4)).toBe('Aprovar e encerrar 4')
  })

  it('says "encerrar", never "negar" — the losers become outdated, not denied', () => {
    // Plan D8: a deliberate departure from the signed-off screens, which read
    // "Aprovar e negar N". The coordinator's page calls these "Sem efeito".
    expect(approveButtonLabel(2)).not.toContain('negar')
  })

  it('falls back to a plain "Aprovar" for a negative count', () => {
    expect(approveButtonLabel(-1)).toBe('Aprovar')
  })
})
