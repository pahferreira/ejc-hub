import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Table, type Action } from './index'
import type { SortDirection } from './TableHeaderCell'

const meta = {
  title: 'UI/Table',
  component: Table,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

const sampleData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Pending' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Inactive' },
]

const handleReview = fn()
const handleEdit = fn()
const handleView = fn()
const handleDelete = fn()

const getActions = (id: number): Action[] => [
  { label: 'View', onClick: () => handleView(id) },
  { label: 'Edit', onClick: () => handleEdit(id) },
  { label: 'Delete', onClick: () => handleDelete(id), variant: 'danger' },
]

export const Default: Story = {
  args: {
    children: (
      <>
        <Table.Header>
          <Table.HeaderCell>Name</Table.HeaderCell>
          <Table.HeaderCell>Email</Table.HeaderCell>
          <Table.HeaderCell>Status</Table.HeaderCell>
        </Table.Header>
        <Table.Body>
          {sampleData.map((row) => (
            <Table.Row key={row.id}>
              <Table.Cell>{row.name}</Table.Cell>
              <Table.Cell>{row.email}</Table.Cell>
              <Table.Cell>{row.status}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Verify table headers are rendered
    await expect(canvas.getByText('Name')).toBeVisible()
    await expect(canvas.getByText('Email')).toBeVisible()
    await expect(canvas.getByText('Status')).toBeVisible()

    // Verify all data rows are rendered
    await expect(canvas.getByText('John Doe')).toBeVisible()
    await expect(canvas.getByText('jane@example.com')).toBeVisible()
    await expect(canvas.getByText('Inactive')).toBeVisible()
  },
}

export const WithSingleAction: Story = {
  args: {
    children: (
      <>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Email</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {sampleData.map((row) => (
            <Table.Row key={row.id}>
              <Table.Cell>{row.name}</Table.Cell>
              <Table.Cell>{row.email}</Table.Cell>
              <Table.ActionCell
                actions={[{ label: 'Review', onClick: () => handleReview(row.id) }]}
              />
            </Table.Row>
          ))}
        </Table.Body>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Get all Review buttons
    const reviewButtons = canvas.getAllByRole('button', { name: 'Review' })
    await expect(reviewButtons).toHaveLength(3)

    // Click the first Review button (John Doe's row)
    await userEvent.click(reviewButtons[0])
    await expect(handleReview).toHaveBeenCalledWith(1)

    // Click the second Review button (Jane Smith's row)
    await userEvent.click(reviewButtons[1])
    await expect(handleReview).toHaveBeenCalledWith(2)
  },
}

export const WithMultipleActions: Story = {
  args: {
    children: (
      <>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Email</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {sampleData.map((row) => (
            <Table.Row key={row.id}>
              <Table.Cell>{row.name}</Table.Cell>
              <Table.Cell>{row.email}</Table.Cell>
              <Table.Cell>{row.status}</Table.Cell>
              <Table.ActionCell actions={getActions(row.id)} />
            </Table.Row>
          ))}
        </Table.Body>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Get all action menu buttons (the three-dot icons)
    const menuButtons = canvas.getAllByRole('button')
    await expect(menuButtons).toHaveLength(3)

    // Click the first menu button to open dropdown
    await userEvent.click(menuButtons[0])

    await new Promise((resolve) => setTimeout(resolve, 500)) // Wait for dropdown animation (if needed)

    // Verify dropdown menu items are visible (using findByRole to wait for animation)
    await expect(await canvas.findByRole('menuitem', { name: 'View' })).toBeVisible()
    await expect(await canvas.findByRole('menuitem', { name: 'Edit' })).toBeVisible()
    await expect(await canvas.findByRole('menuitem', { name: 'Delete' })).toBeVisible()

    // Click the Edit action
    await userEvent.click(await canvas.findByRole('menuitem', { name: 'Edit' }))
    await expect(handleEdit).toHaveBeenCalledWith(1)

    // Open the menu again and click View
    await userEvent.click(menuButtons[0])
    await new Promise((resolve) => setTimeout(resolve, 500)) // Wait for dropdown animation (if needed)
    await userEvent.click(await canvas.findByRole('menuitem', { name: 'View' }))
    await expect(handleView).toHaveBeenCalledWith(1)

    // Open the menu again and click Delete
    await userEvent.click(menuButtons[0])
    await new Promise((resolve) => setTimeout(resolve, 500)) // Wait for dropdown animation (if needed)
    await userEvent.click(await canvas.findByRole('menuitem', { name: 'Delete' }))
    await expect(handleDelete).toHaveBeenCalledWith(1)
  },
}

export const EmptyState: Story = {
  args: {
    children: (
      <>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Email</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell colSpan={3}>No data available</Table.Cell>
          </Table.Row>
        </Table.Body>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Verify empty state message is displayed
    await expect(canvas.getByText('No data available')).toBeVisible()

    // Verify headers are still rendered
    await expect(canvas.getByText('Name')).toBeVisible()
    await expect(canvas.getByText('Email')).toBeVisible()
    await expect(canvas.getByText('Status')).toBeVisible()

    // Verify no data rows are present
    await expect(canvas.queryByText('John Doe')).not.toBeInTheDocument()
  },
}

function SortableExample() {
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const sorted = [...sampleData].sort((a, b) =>
    sortDirection === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
  )

  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell
            sortDirection={sortDirection}
            onSort={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          >
            Name
          </Table.HeaderCell>
          <Table.HeaderCell sortDirection={false}>Email</Table.HeaderCell>
          <Table.HeaderCell>Status</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {sorted.map((row) => (
          <Table.Row key={row.id}>
            <Table.Cell>{row.name}</Table.Cell>
            <Table.Cell>{row.email}</Table.Cell>
            <Table.Cell>{row.status}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  )
}

/**
 * `Name` is the active sort key, `Email` is sortable but inactive, and `Status`
 * omits `sortDirection` entirely so it stays a plain header.
 */
export const Sortable: Story = {
  args: { children: null },
  render: () => <SortableExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // The active column advertises its direction to assistive tech
    await expect(canvas.getByRole('columnheader', { name: /name/i })).toHaveAttribute(
      'aria-sort',
      'ascending'
    )

    // A sortable but inactive column reports no sort
    await expect(canvas.getByRole('columnheader', { name: /email/i })).toHaveAttribute(
      'aria-sort',
      'none'
    )

    // A non-sortable column has no sort affordance at all
    await expect(canvas.getByRole('columnheader', { name: 'Status' })).not.toHaveAttribute(
      'aria-sort'
    )

    await expect(canvas.getAllByRole('row')[1]).toHaveTextContent('Bob Johnson')

    await userEvent.click(canvas.getByRole('button', { name: /name/i }))

    await expect(canvas.getByRole('columnheader', { name: /name/i })).toHaveAttribute(
      'aria-sort',
      'descending'
    )
    await expect(canvas.getAllByRole('row')[1]).toHaveTextContent('John Doe')
  },
}

/** Drops the outer frame so the header strip can run edge to edge inside a card. */
export const Borderless: Story = {
  args: {
    bordered: false,
    children: (
      <>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Email</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {sampleData.map((row) => (
            <Table.Row key={row.id}>
              <Table.Cell>{row.name}</Table.Cell>
              <Table.Cell>{row.email}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </>
    ),
  },
}
