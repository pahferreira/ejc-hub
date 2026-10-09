import { isAxiosError } from 'axios'
import { api } from '../api'
import { errorMessage, type ApiError } from '../general/error'
import type {
  CreateRequestsResult,
  MemberRequestQueueFilters,
  MemberRequestQueueList,
  RequestableCandidateFilters,
  RequestableCandidateList,
  RequestPagination,
  ResolveRequestResult,
  SettableRequestStatus,
} from './member-requests.types'

async function getRequestableMembers(
  filters: RequestableCandidateFilters = {},
  pagination: RequestPagination = {}
) {
  const params = new URLSearchParams()

  // Each key is set only when it carries a value: an empty `name=` or
  // `skills=` would put an extra entry in the React Query key and refetch for
  // nothing the API would have dropped anyway.
  if (filters.name) {
    params.set('name', filters.name)
  }

  if (filters.skills?.length) {
    params.set('skills', filters.skills.join(','))
  }

  if (filters.experience?.length) {
    params.set('experience', filters.experience.join(','))
  }

  if (filters.preference) {
    params.set('preference', filters.preference)
  }

  if (pagination.page !== undefined) {
    params.set('page', String(pagination.page))
  }

  if (pagination.pageSize !== undefined) {
    params.set('pageSize', String(pagination.pageSize))
  }

  const response = await api.get<RequestableCandidateList>('/member-requests/candidates', {
    params,
  })

  return response.data
}

/**
 * Files one request, through the batch body — same reasoning as
 * `setEventFeePaymentsStatus`: always the batch route, even for a single
 * person, so there is only one call path to keep the error handling and cache
 * invalidation in step.
 *
 * The only per-api-file error unwrap outside `events.api.ts`: `member_already_assigned`
 * is the one failure this write can hit that the generic axios error would
 * otherwise surface as the raw API message.
 */
async function createMemberRequests(userIds: string[], message?: string) {
  try {
    const response = await api.post<{ result: CreateRequestsResult }>('/member-requests', {
      userIds,
      message,
    })

    return response.data.result
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response) {
      const apiError = error as ApiError
      const errorCode = apiError.response.data?.code
      const appErrorMessage = errorCode
        ? (errorMessage[errorCode] ?? apiError.response.data.message)
        : 'Erro ao solicitar membro'

      throw new Error(appErrorMessage)
    }
    throw new Error('Erro ao solicitar membro')
  }
}

/**
 * The admin queue: one page of requests plus the four event-wide card counts.
 *
 * `status` and `disputed` are two axes, never both at once — the page holds one
 * `cardFilter` and maps it (plan D10).
 */
async function getMemberRequestQueue(
  filters: MemberRequestQueueFilters = {},
  pagination: RequestPagination = {}
) {
  const params = new URLSearchParams()

  if (filters.status) {
    params.set('status', filters.status)
  }

  if (filters.disputed) {
    params.set('disputed', 'true')
  }

  if (filters.name) {
    params.set('name', filters.name)
  }

  if (filters.teamKey) {
    params.set('teamKey', filters.teamKey)
  }

  if (pagination.page !== undefined) {
    params.set('page', String(pagination.page))
  }

  if (pagination.pageSize !== undefined) {
    params.set('pageSize', String(pagination.pageSize))
  }

  const response = await api.get<MemberRequestQueueList>('/events/current/member-requests', {
    params,
  })

  return response.data
}

/**
 * An admin's answer to one request.
 *
 * Carries the same error unwrap as `createMemberRequests`, for the same code:
 * approving someone a concurrent approval already placed answers 422 with
 * `member_already_assigned`, and the raw API message is not what an admin
 * should read.
 */
async function resolveMemberRequest(
  requestId: string,
  status: SettableRequestStatus,
  resolutionReason?: string
) {
  try {
    const response = await api.put<{ result: ResolveRequestResult }>(
      `/member-requests/admin/${requestId}/status`,
      { status, resolutionReason }
    )

    return response.data.result
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response) {
      const apiError = error as ApiError
      const errorCode = apiError.response.data?.code
      const appErrorMessage = errorCode
        ? (errorMessage[errorCode] ?? apiError.response.data.message)
        : 'Erro ao responder a solicitação'

      throw new Error(appErrorMessage)
    }
    throw new Error('Erro ao responder a solicitação')
  }
}

export const memberRequestsApi = {
  getRequestableMembers,
  createMemberRequests,
  getMemberRequestQueue,
  resolveMemberRequest,
}
