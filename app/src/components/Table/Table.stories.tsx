import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/internal/test'
import { Table, type Action } from './index'

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
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Email</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
          </Table.Row>
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
}
