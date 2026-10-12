import { z } from 'zod/v4'
import { MEMBER_REQUEST_MESSAGE_MAX } from '../../../../../common/member-requests/member-request.constants.ts'
import {
  MEMBER_REQUEST_STATUSES,
  SETTABLE_REQUEST_STATUSES,
} from '../../../modules/member-request/domain/member-request-status.ts'

/**
 * The one cap, shared with the modals' `0/400` counters through `common/`.
 *
 * Trimmed before measuring so trailing whitespace cannot fail a reason the
 * counter showed as fitting.
 */
const reasonSchema = z.string().trim().max(MEMBER_REQUEST_MESSAGE_MAX)

/**
 * Filing requests.
 *
 * No `teamInstanceId`: the coordinator's team is derived from their own
 * membership, so asking on another team's behalf is unrepresentable rather than
 * something to guard against.
 *
 * `message` is optional here even though the modal requires one. A reason is a
 * coordination courtesy, not an integrity rule, and a required field would have
 * to be reasserted by every future caller.
 */
export const createMemberRequestsBodySchema = z.object({
  userIds: z.array(z.uuid()).min(1, 'at least one member is required'),
  message: reasonSchema.optional(),
})

export const memberRequestParamsSchema = z.object({
  requestId: z.uuid(),
})

/**
 * Approving or denying.
 *
 * The enum is derived from `SETTABLE_REQUEST_STATUSES` so the HTTP contract
 * cannot drift from the domain — `cancelled` is the coordinator's word and
 * `outdated` is the system's, and neither is an admin's to set.
 *
 * `resolutionReason` is optional including for a denial: the deny modal requires
 * one and the API does not, matching how `message` is treated above.
 */
export const resolveMemberRequestBodySchema = z.object({
  status: z.enum(SETTABLE_REQUEST_STATUSES),
  resolutionReason: reasonSchema.optional(),
})

const experienceTypeEnum = z.enum(['newbie', 'experienced', 'experienced_outsider'])

/**
 * A repeated filter arriving as one `a,b` query parameter.
 *
 * Every multi-value control above a table in this app is a checkbox group, so
 * the wire format is shared rather than re-spelled per field. Blank segments
 * are dropped, which is what a cleared control sending `experience=` means.
 */
const commaSeparated = <Schema extends z.ZodTypeAny>(itemSchema: Schema) =>
  z.preprocess((value) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
    }

    return value
  }, z.array(itemSchema).optional())

/** Matches the cap every other list route uses, so no route can be a bulk export. */
export const MAX_REQUEST_PAGE_SIZE = 100

const paginationShape = {
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(MAX_REQUEST_PAGE_SIZE).optional(),
}

/**
 * The "Solicitar Membros" table's controls.
 *
 * `skills` and `experience` are both comma-separated: each is a multi-select on
 * screen (`MultiSelector` and `FilterCheck`, which is a checkbox group), and a
 * single-valued `experience` would have forced the UI to fake a radio out of a
 * control every other page in the app uses to tick several boxes — see plan
 * decision D15. `name` is trimmed to a non-empty string so a cleared search box,
 * which sends `name=`, is dropped rather than matching everything through an
 * empty `includes`.
 */
export const listRequestableCandidatesQuerystringSchema = z.object({
  name: z.string().trim().min(1).optional(),
  skills: commaSeparated(z.string()),
  experience: commaSeparated(experienceTypeEnum),
  preference: z.enum(['team', 'all']).optional(),
  ...paginationShape,
})

/**
 * The admin queue's controls.
 *
 * `status` takes all five, not just the settable two: this is a read, and the
 * queue legitimately shows what the system wrote.
 *
 * `disputed` is a separate boolean rather than a sixth status value. A disputed
 * request's status *is* `pending`; "disputed" describes the member, not the
 * request, so the two compose instead of one lying about the other.
 */
export const listMemberRequestsQuerystringSchema = z.object({
  status: z.enum(MEMBER_REQUEST_STATUSES).optional(),
  disputed: z
    .preprocess(
      (value) => (value === 'true' ? true : value === 'false' ? false : value),
      z.boolean()
    )
    .optional(),
  name: z.string().trim().min(1).optional(),
  teamKey: z.string().trim().min(1).optional(),
  ...paginationShape,
})

/**
 * The coordinator's own queue's controls.
 *
 * `status` takes all five, not just the settable two — the same reasoning as
 * the admin queue's schema above: with none selected, the list shows every
 * status, including `cancelled` and `outdated` (plan I.7).
 */
export const listMyTeamRequestsQuerystringSchema = z.object({
  name: z.string().trim().min(1).optional(),
  status: z.enum(MEMBER_REQUEST_STATUSES).optional(),
})

export type CreateMemberRequestsBody = z.infer<typeof createMemberRequestsBodySchema>
export type ResolveMemberRequestBody = z.infer<typeof resolveMemberRequestBodySchema>
export type ListRequestableCandidatesQuerystring = z.infer<
  typeof listRequestableCandidatesQuerystringSchema
>
export type ListMemberRequestsQuerystring = z.infer<typeof listMemberRequestsQuerystringSchema>
export type ListMyTeamRequestsQuerystring = z.infer<typeof listMyTeamRequestsQuerystringSchema>
