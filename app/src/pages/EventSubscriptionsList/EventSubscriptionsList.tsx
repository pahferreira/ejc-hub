import { useState, useMemo, useEffect } from 'react'
import {
  flexRender,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
} from '@tanstack/react-table'
import { DashboardSection } from '../../components/DashboardSection/DashboardSection'
import { SubscriptionSummaryBox } from '../../components/SubscriptionSummaryBox/SubscriptionSummaryBox'
import { SearchInput } from '../../components/SearchInput/SearchInput'
import { MultiSelector } from '../../components/MultiSelector/MultiSelector'
import type { Option } from '../../components/MultiSelector/MultiSelector'
import { Table } from '../../components/Table'
import { Button } from '../../components/Button/Button'
import { Pagination } from '../../components/Pagination/Pagination'
import { useSubscriptions } from './useSubscriptions'
import { subscriptionColumns } from './columns'
import { ReviewSubscriptionModal } from './ReviewSubscriptionModal'
import { useConfirmSubscriptionMutation } from '../../services/subscriptions/useConfirmSubscriptionMutation'
import { useWaitListSubscriptionMutation } from '../../services/subscriptions/useWaitListSubscriptionMutation'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { usePagination } from '../../hooks/usePagination'
import { useTeamOptionsQuery } from '../../services/teams/useTeamOptionsQuery'
import type { SubscriptionWithDetails } from '../../services/subscriptions/subscriptions.types'
import type {
  SubscriptionStatus,
  SubscriptionListFilters,
} from '../../services/events/events.types'
import { subscriptionStatusOptions } from '../../services/events/subscriptionStatusDisplay'

export function EventSubscriptionsList() {
  const [searchValue, setSearchValue] = useState('')
  const [selectedTeamKeys, setSelectedTeamKeys] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<SubscriptionStatus[]>([])

  const debouncedSearch = useDebouncedValue(searchValue, 300)
  const { page, pageSize, nextPage, prevPage, resetPage } = usePagination()

  const filters: SubscriptionListFilters = {
    ...(debouncedSearch ? { name: debouncedSearch } : {}),
    ...(selectedTeamKeys.length > 0 ? { teamKeys: selectedTeamKeys } : {}),
    ...(selectedStatuses.length > 0 ? { status: selectedStatuses } : {}),
  }

  useEffect(() => {
    resetPage()
  }, [debouncedSearch, selectedTeamKeys, selectedStatuses, resetPage])

  const { subscriptions, total, stats, totalCount, isLoading, error } = useSubscriptions({
    filters,
    pagination: { page, pageSize },
  })
  const teamOptionsQuery = useTeamOptionsQuery()

  const [reviewingSubscription, setReviewingSubscription] =
    useState<SubscriptionWithDetails | null>(null)

  const confirmMutation = useConfirmSubscriptionMutation()
  const waitListMutation = useWaitListSubscriptionMutation()

  const teamOptions: Option[] = useMemo(
    () => (teamOptionsQuery.data ?? []).map((t) => ({ value: t.key, label: t.name })),
    [teamOptionsQuery.data]
  )

  const selectedTeamOptions: Option[] = teamOptions.filter((o) =>
    selectedTeamKeys.includes(o.value)
  )

  const selectedStatusOptions: Option[] = subscriptionStatusOptions.filter((o) =>
    selectedStatuses.includes(o.value as SubscriptionStatus)
  )

  function handleTeamOptionsChange(options: Option[]) {
    setSelectedTeamKeys(options.map((o) => o.value))
  }

  function handleStatusOptionsChange(options: Option[]) {
    setSelectedStatuses(options.map((o) => o.value as SubscriptionStatus))
  }

  function toggleStatusFilter(status: SubscriptionStatus) {
    setSelectedStatuses((prev) => {
      if (prev.length === 1 && prev[0] === status) {
        return []
      }
      return [status]
    })
  }

  const table = useReactTable({
    data: subscriptions,
    columns: subscriptionColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  function handleReview(subscription: SubscriptionWithDetails) {
    setReviewingSubscription(subscription)
  }

  function handleConfirmSubscription(id: string) {
    confirmMutation.mutate(id)
    setReviewingSubscription(null)
  }

  function handleWaitListSubscription(id: string) {
    waitListMutation.mutate(id)
    setReviewingSubscription(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando inscrições...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Error: {error.message}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 m-0">Lista de Inscrições</h1>
          <p className="mt-2 text-gray-600">Todos os encontreiros inscritos no próximo encontro</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <SubscriptionSummaryBox
            title="Montados"
            value={stats.completed}
            variant="completed"
            active={selectedStatuses.includes('completed')}
            onClick={() => toggleStatusFilter('completed')}
          />
          <SubscriptionSummaryBox
            title="Pendentes"
            value={stats.pending}
            variant="pending"
            active={selectedStatuses.includes('pending')}
            onClick={() => toggleStatusFilter('pending')}
          />
          <SubscriptionSummaryBox
            title="Lista de Espera"
            value={stats.waiting_list}
            variant="waitlist"
            active={selectedStatuses.includes('waiting_list')}
            onClick={() => toggleStatusFilter('waiting_list')}
          />
          <SubscriptionSummaryBox title="Total de Inscrições" value={totalCount} variant="total" />
        </div>

        <DashboardSection>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <SearchInput
                placeholder="Pesquisar por nome"
                value={searchValue}
                onChange={setSearchValue}
              />
            </div>
            <div className="sm:w-64">
              <MultiSelector
                options={teamOptions}
                selected={selectedTeamOptions}
                onChange={handleTeamOptionsChange}
                placeholder="Todas as equipes"
              />
            </div>
            <div className="sm:w-64">
              <MultiSelector
                options={subscriptionStatusOptions}
                selected={selectedStatusOptions}
                onChange={handleStatusOptionsChange}
                placeholder="Todos os status"
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

          <Table>
            <Table.Header>
              {table.getHeaderGroups().map((headerGroup) => (
                <Table.Row key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <Table.HeaderCell key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </Table.HeaderCell>
                  ))}
                  <Table.HeaderCell>{''}</Table.HeaderCell>
                </Table.Row>
              ))}
            </Table.Header>
            <Table.Body>
              {table.getRowModel().rows.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={6}>
                    <div className="text-center py-8 text-gray-500">
                      Nenhuma inscrição feita até o momento.
                    </div>
                  </Table.Cell>
                </Table.Row>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <Table.Row key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <Table.Cell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Table.Cell>
                    ))}
                    <Table.Cell>
                      <Button variant="secondary" onClick={() => handleReview(row.original)}>
                        Revisar
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table>

          <div className="mt-4 flex justify-end">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPrev={prevPage}
              onNext={nextPage}
            />
          </div>
        </DashboardSection>
      </div>

      <ReviewSubscriptionModal
        subscription={reviewingSubscription}
        open={reviewingSubscription !== null}
        onClose={() => setReviewingSubscription(null)}
        onConfirm={handleConfirmSubscription}
        onWaitList={handleWaitListSubscription}
      />
    </div>
  )
}
