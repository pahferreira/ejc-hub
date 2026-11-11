import { describe, it, expect } from 'vitest'
import { AppError, AppErrorCode } from '../../../shared/AppError.ts'
import { DAY_DATE_TAKEN, withDayDateUnique } from './day-date-unique.ts'

/** A `pg` unique violation, wrapped the way Drizzle wraps it. */
function uniqueViolation(constraint: string): Error {
  return new Error('Failed query', { cause: { code: '23505', constraint } })
}

async function caught(promise: Promise<unknown>): Promise<unknown> {
  return promise.then(
    () => undefined,
    (error: unknown) => error
  )
}

describe('withDayDateUnique', () => {
  it("returns the write's result", async () => {
    await expect(withDayDateUnique(() => Promise.resolve('day-sat'))).resolves.toBe('day-sat')
  })

  it("answers a conflict when the day's date is already taken", async () => {
    const error = await caught(
      withDayDateUnique(() => Promise.reject(uniqueViolation('schedule_days_event_id_date_unique')))
    )

    expect(error).toBeInstanceOf(AppError)
    expect((error as AppError).getAppErrorCode()).toBe(AppErrorCode.Conflict)
    expect((error as AppError).message).toBe(DAY_DATE_TAKEN)
  })

  it("re-throws another constraint's violation as it is", async () => {
    const violation = uniqueViolation('some_other_unique')

    await expect(withDayDateUnique(() => Promise.reject(violation))).rejects.toBe(violation)
  })

  it('re-throws an error that is not a unique violation as it is', async () => {
    const failure = new Error('connection lost')

    await expect(withDayDateUnique(() => Promise.reject(failure))).rejects.toBe(failure)
  })
})
