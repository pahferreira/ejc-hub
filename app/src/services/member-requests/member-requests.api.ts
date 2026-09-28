import { isAxiosError } from 'axios'
import { api } from '../api'
import { errorMessage, type ApiError } from '../general/error'
import type {
  CreateRequestsResult,
  RequestableCandidateFilters,
  RequestableCandidateList,
  RequestPagination,
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

export const memberRequestsApi = {
  getRequestableMembers,
  createMemberRequests,
}
