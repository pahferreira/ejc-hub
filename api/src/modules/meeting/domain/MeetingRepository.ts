import type { DbExecutor } from '../../../core/database/client.ts'
import type { MeetingModel } from '../../../core/database/schemas/index.ts'

export type InsertMeetingInput = {
  teamInstanceId: string
  eventId: string
  /** `YYYY-MM-DD`. */
  heldOn: string
  title?: string | null
  description?: string | null
  /** The coordinator registering it. */
  createdBy: string
}

export type UpdateMeetingInput = {
  heldOn: string
  title?: string | null
  description?: string | null
}

export interface MeetingRepository {
  insertMeeting: (input: InsertMeetingInput, executor?: DbExecutor) => Promise<MeetingModel>

  /** One meeting, or `undefined` when the id names nothing. */
  getMeeting: (id: string) => Promise<MeetingModel | undefined>

  /**
   * Every meeting one team has registered, most recently held first.
   *
   * Ties on the same day break by registration order, newest first, so two
   * meetings on one date always list the same way.
   */
  listMeetingsByTeamInstance: (teamInstanceId: string) => Promise<MeetingModel[]>

  /**
   * Rewrites a meeting's date, title and description and stamps `updated_at`,
   * which is what marks it "editada".
   *
   * Returns the updated row, or `undefined` when the id names nothing.
   */
  updateMeeting: (
    id: string,
    input: UpdateMeetingInput,
    executor?: DbExecutor
  ) => Promise<MeetingModel | undefined>

  /**
   * Hard-deletes a meeting. Its attendance rows go with it, by the FK's cascade.
   *
   * Returns the deleted row, or `undefined` when the id names nothing.
   */
  deleteMeeting: (id: string, executor?: DbExecutor) => Promise<MeetingModel | undefined>
}
