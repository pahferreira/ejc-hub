import { flexRender } from '@tanstack/react-table'
import { DashboardSection } from '../../components/DashboardSection/DashboardSection'
import { SubscriptionSummaryBox } from '../../components/SubscriptionSummaryBox/SubscriptionSummaryBox'
import { SearchInput } from '../../components/SearchInput/SearchInput'
import { MultiSelector } from '../../components/MultiSelector/MultiSelector'
import { Table } from '../../components/Table'
import { useSubscriptions } from './useSubscriptions'
import { useSubscriptionsListTable } from './useSubscriptionsListTable'

function handleReview(subscriptionId: string): void {
  alert(`Review subscription: ${subscriptionId}`)
}

export function EventSubscriptionsList() {
  const { subscriptions, stats, isLoading, error } = useSubscriptions()
  const { table, searchValue, setSearchValue, selectedTeams, setSelectedTeams, teamOptions } =
    useSubscriptionsListTable(subscriptions)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading subscriptions...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Error: {error.message}</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 m-0">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage event subscriptions and team assignments</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <SubscriptionSummaryBox title="Total Subscriptions" value={stats.total} variant="total" />
          <SubscriptionSummaryBox title="Pending Review" value={stats.pending} variant="pending" />
          <SubscriptionSummaryBox title="Approved" value={stats.approved} variant="approved" />
        </div>

        <DashboardSection
          title="Subscriptions"
          subtitle="View and manage all event subscriptions"
        >
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <SearchInput
                placeholder="Search by name or email..."
                value={searchValue}
                onChange={setSearchValue}
              />
            </div>
            <div className="sm:w-64">
              <MultiSelector
                options={teamOptions}
                selected={selectedTeams}
                onChange={setSelectedTeams}
                placeholder="All Teams"
              />
            </div>
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
                  <Table.HeaderCell>Actions</Table.HeaderCell>
                </Table.Row>
              ))}
            </Table.Header>
            <Table.Body>
              {table.getRowModel().rows.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={6}>
                    <div className="text-center py-8 text-gray-500">No subscriptions found</div>
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
                    <Table.ActionCell
                      actions={[
                        { label: 'Review', onClick: () => handleReview(row.original.id) },
                      ]}
                    />
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table>
        </DashboardSection>
      </div>
    </main>
  )
}
