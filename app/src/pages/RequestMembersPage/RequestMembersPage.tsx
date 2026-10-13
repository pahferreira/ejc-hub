import { useEffect, useMemo, useState } from 'react'
import { MultiSelector } from '../../components/MultiSelector/MultiSelector'
import { FilterCheck } from '../../components/FilterCheck/FilterCheck'
import { Pagination } from '../../components/Pagination/Pagination'
import { RequestMemberModal } from '../../components/RequestMemberModal/RequestMemberModal'
import { RequestMembersTable } from '../../components/RequestMembersTable/RequestMembersTable'
import { SearchInput } from '../../components/SearchInput/SearchInput'
import { StatusCard } from '../../components/StatusCard/StatusCard'
import { TeamPreferenceFilter } from '../../components/TeamPreferenceFilter/TeamPreferenceFilter'
import type { TeamPreferenceScope } from '../../components/TeamPreferenceFilter/TeamPreferenceFilter'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { usePagination } from '../../hooks/usePagination'
import { useCurrentEventSubscriptionStatusQuery } from '../../services/events/useCurrentEventSubscriptionStatusQuery'
import { useCreateMemberRequestMutation } from '../../services/member-requests/useCreateMemberRequestMutation'
import { useRequestableMembersQuery } from '../../services/member-requests/useRequestableMembersQuery'
import { experienceFilterOptions, skillFilterOptions } from '../TeamBuildingPage/experience'
import { toastPromise } from '../../utils/toast/toast'
import type { RequestableCandidateFilters } from '../../services/member-requests/member-requests.types'
import type { ExperienceType } from '../../services/team-building/team-building.types'
import { usePostHog } from '@posthog/react'

const REQUEST_MEMBERS_PAGE_SIZE = 15

/**
 * "Solicitar Membros": a coordinator browses the event's unplaced subscribers
 * and asks for one person at a time, with a reason.
 *
 * Structurally `EventFeeMembersPage` with three cards instead of five and a
 * modal instead of a bulk bar: cards + filter row + a server-paged table, one
 * endpoint feeding all three (plan G.1). The coordinator check and its branch
 * order are `CoordinatorEventFeePage`'s, verbatim — the error branch stays
 * above the coordinator one so a dropped request is never read as a verdict.
 *
 * The candidates route itself 403s for anyone who is not a coordinator, so
 * `useRequestableMembersQuery` is gated on `isCoordinator` — firing it
 * unconditionally would race that 403 into the generic "could not load"
 * branch instead of the friendlier "not a coordinator" one below it.
 */
export function RequestMembersPage() {
  const [search, setSearch] = useState('')
  const [skillsFilter, setSkillsFilter] = useState<string[]>([])
  const [experienceFilter, setExperienceFilter] = useState<string[]>([])
  const [preferenceScope, setPreferenceScope] = useState<TeamPreferenceScope>('team')
  // Who the modal is about, held by id and looked up in the live rows below —
  // so a refetch that places the person elsewhere while the modal is open is
  // reflected instead of submitting against a stale row.
  const [requestedUserId, setRequestedUserId] = useState<string | null>(null)
  const postHog = usePostHog()

  const debouncedSearch = useDebouncedValue(search, 300)
  const { page, pageSize, nextPage, prevPage, resetPage } = usePagination(REQUEST_MEMBERS_PAGE_SIZE)

  const filters: RequestableCandidateFilters = useMemo(
    () => ({
      ...(debouncedSearch ? { name: debouncedSearch } : {}),
      ...(skillsFilter.length ? { skills: skillsFilter } : {}),
      ...(experienceFilter.length ? { experience: experienceFilter as ExperienceType[] } : {}),
      ...(preferenceScope === 'team' ? { preference: 'team' as const } : {}),
    }),
    [debouncedSearch, skillsFilter, experienceFilter, preferenceScope]
  )

  const hasActiveFilters = Object.keys(filters).length > 0

  useEffect(() => {
    resetPage()
  }, [filters, resetPage])

  const subscriptionStatus = useCurrentEventSubscriptionStatusQuery()
  const isCoordinator = subscriptionStatus.data?.myMembershipType === 'coordinator'

  const requestableMembersQuery = useRequestableMembersQuery(
    filters,
    { page, pageSize },
    { enabled: isCoordinator }
  )
  const createRequestMutation = useCreateMemberRequestMutation(filters, { page, pageSize })

  const rows = requestableMembersQuery.data?.items ?? []
  const total = requestableMembersQuery.data?.total ?? 0

  // Resolved from the page on screen, so an id left over from a filter change
  // or a page turn simply closes the dialog rather than requesting a ghost.
  const requestedMember = rows.find((row) => row.userId === requestedUserId) ?? null

  useEffect(() => {
    if (requestedUserId !== null && requestedMember === null) {
      setRequestedUserId(null)
    }
  }, [requestedUserId, requestedMember])

  const handleSubmit = (message: string) => {
    if (!requestedMember) {
      return
    }

    const { userId } = requestedMember

    toastPromise(createRequestMutation.mutateAsync({ userId, message }), {
      message: 'Solicitação enviada com sucesso!',
      callback: () => postHog.capture('action-member-requested'),
    })

    // Closed synchronously, not on the mutation's own success: the mutation's
    // `onMutate` has already flipped the row to `requested` by the time this
    // runs, so the table behind the modal is already showing the right state
    // (plan G.6).
    setRequestedUserId(null)
  }

  if (subscriptionStatus.isLoading || requestableMembersQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando inscrições...</div>
      </div>
    )
  }

  if (subscriptionStatus.error || requestableMembersQuery.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Não foi possível carregar os inscritos sem equipe.</div>
      </div>
    )
  }

  // After the error branch: a dropped status request leaves `myMembershipType`
  // undefined, which read as a verdict would tell a coordinator the page is
  // not for them when all that happened was a failed fetch.
  if (!isCoordinator) {
    return (
      <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-8xl mx-auto rounded-xl border border-tertiary bg-white px-6 py-12 text-center shadow-md">
          <p className="m-0 text-sm text-gray-600">
            Esta página é exclusiva para coordenadores de equipe.
          </p>
        </div>
      </div>
    )
  }

  const data = requestableMembersQuery.data

  if (!data) {
    return null
  }

  const { team, stats } = data

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-8xl mx-auto">
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 m-0">Solicitar Membros</h1>
          </div>
          <p className="mt-2 text-gray-600">
            Inscritos sem equipe designada. Solicite quem combina com as vagas da sua equipe.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatusCard
            title="Vagas na minha equipe"
            value={stats.freeSlots}
            variant="neutral"
            description={`${stats.memberCount} de ${stats.maxCapacity} preenchidas`}
          />
          <StatusCard
            title="Solicitações pendentes"
            value={stats.pendingRequests}
            variant="pending"
            description={`${stats.freeSlotsIfAllApproved} vagas livres se todas forem aprovadas`}
          />
          <StatusCard
            title="Solicitações aprovadas"
            value={stats.approvedRequests}
            variant="success"
            description="Membros já confirmados na equipe"
          />
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="min-w-55 flex-1">
            <SearchInput
              fullWidth
              placeholder="Pesquisar por nome"
              value={search}
              onChange={setSearch}
            />
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-3">
            <div className="min-w-55">
              <MultiSelector
                options={skillFilterOptions}
                selected={skillFilterOptions.filter((option) =>
                  skillsFilter.includes(option.value)
                )}
                onChange={(options) => setSkillsFilter(options.map((option) => option.value))}
                placeholder="Todas as habilidades"
              />
            </div>
            <FilterCheck
              label="Exp."
              options={experienceFilterOptions}
              value={experienceFilter}
              onChange={setExperienceFilter}
              ariaLabel="Filtrar por experiência"
            />
            <TeamPreferenceFilter
              teamName={team.name}
              value={preferenceScope}
              onChange={setPreferenceScope}
            />
          </div>
        </div>

        <div className="mb-4 flex justify-end">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPrev={prevPage}
            onNext={nextPage}
          />
        </div>

        <RequestMembersTable
          rows={rows}
          onRequest={(row) => setRequestedUserId(row.userId)}
          emptyMessage={
            hasActiveFilters
              ? 'Nenhum inscrito encontrado com os filtros atuais.'
              : 'Nenhum inscrito sem equipe no momento.'
          }
        />
      </div>

      <RequestMemberModal
        open={requestedMember !== null}
        member={requestedMember}
        freeSlots={stats.freeSlots}
        isSaving={createRequestMutation.isPending}
        onClose={() => setRequestedUserId(null)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
