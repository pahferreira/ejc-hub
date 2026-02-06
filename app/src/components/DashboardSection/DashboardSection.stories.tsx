import type { Meta, StoryObj } from '@storybook/react'
import { DashboardSection } from './DashboardSection'

const meta = {
  title: 'Components/DashboardSection',
  component: DashboardSection,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DashboardSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Ações Rápidas',
    children: (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="m-0 text-gray-600">Content goes here</p>
      </div>
    ),
  },
}

export const WithSubtitle: Story = {
  args: {
    title: 'Administração',
    subtitle: 'Gerencie eventos, equipes e inscrições',
    children: (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="m-0 text-gray-600">Admin content goes here</p>
      </div>
    ),
  },
}
