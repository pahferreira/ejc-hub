import { describe, expect, it, vi } from 'vitest'
import { undoToastAction } from './useScheduleControls'

function click(action: ReturnType<typeof undoToastAction>) {
  const event = { preventDefault: vi.fn() }
  action.onClick(event)
  return event
}

describe('undoToastAction', () => {
  it('undoes and lets the toast close when no control is in flight', () => {
    const undo = vi.fn()

    const event = click(undoToastAction(undo, () => false))

    expect(undo).toHaveBeenCalledOnce()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('does nothing while another control is in flight, keeping the toast open', () => {
    const undo = vi.fn()

    const event = click(undoToastAction(undo, () => true))

    expect(undo).not.toHaveBeenCalled()
    expect(event.preventDefault).toHaveBeenCalledOnce()
  })

  it('reads whether a control is pending at click time, not when the toast opens', () => {
    const undo = vi.fn()
    let pending = true
    const action = undoToastAction(undo, () => pending)

    click(action)
    pending = false
    click(action)

    expect(undo).toHaveBeenCalledOnce()
  })

  it('is labelled Desfazer', () => {
    expect(undoToastAction(vi.fn(), () => false).label).toBe('Desfazer')
  })
})
