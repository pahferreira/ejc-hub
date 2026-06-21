import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import {
  TeamsToolbar,
  type TeamsSortOption,
  type TeamsStatusFilter,
  type TeamsViewMode,
} from './TeamsToolbar'

const meta = {
  title: 'UI/TeamsToolbar',
  component: TeamsToolbar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    onSearchChange: fn(),
    onStatusFilterChange: fn(),
    onSortChange: fn(),
    onViewModeChange: fn(),
  },
} satisfies Meta<typeof TeamsToolbar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    search: '',
    statusFilter: 'all',
    sort: 'name_asc',
    viewMode: 'grid',
  },
}

export const FilterActive: Story = {
  args: {
    search: '',
    statusFilter: 'needsMembers',
    sort: 'name_asc',
    viewMode: 'grid',
  },
}

export const SearchTyped: Story = {
  args: {
    search: 'Acolhida',
    statusFilter: 'all',
    sort: 'name_asc',
    viewMode: 'grid',
  },
}

export const Interactive: Story = {
  args: {
    search: '',
    statusFilter: 'all',
    sort: 'name_asc',
    viewMode: 'grid',
  },
  render: () => {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<TeamsStatusFilter>('all')
    const [sort, setSort] = useState<TeamsSortOption>('name_asc')
    const [viewMode, setViewMode] = useState<TeamsViewMode>('grid')

    return (
      <div className="flex flex-col gap-4">
        <TeamsToolbar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sort={sort}
          onSortChange={setSort}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        <pre className="rounded-md bg-tertiary-background p-3 text-xs text-dark-brown">
          {JSON.stringify({ search, statusFilter, sort, viewMode }, null, 2)}
        </pre>
      </div>
    )
  },
}
