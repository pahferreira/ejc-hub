import { AppError, AppErrorCode } from '../../../shared/AppError.ts'
import { isUniqueViolation } from '../../../shared/is-unique-violation.ts'

const DAY_DATE_UNIQUE = 'schedule_days_event_id_date_unique'
export const DAY_DATE_TAKEN = 'The event already has a day on this date'

/**
 * Runs a write that sets a day's date, turning the `unique(event_id, date)`
 * violation into the same 409 the read gives. The constraint is what catches
 * two admins taking the same date at once.
 */
export async function withDayDateUnique<T>(write: () => Promise<T>): Promise<T> {
  try {
    return await write()
  } catch (error) {
    if (isUniqueViolation(error, DAY_DATE_UNIQUE)) {
      throw new AppError(DAY_DATE_TAKEN, AppErrorCode.Conflict)
    }
    throw error
  }
}
