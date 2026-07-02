import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { TeamPreferenceFilter, type TeamPreferenceScope } from './TeamPreferenceFilter'

const meta = {
  title: 'UI/TeamPreferenceFilter',
  component: TeamPreferenceFilter,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    teamName: 'Liturgia',
    onChange: fn(),
  },
} satisfies Meta<typeof TeamPreferenceFilter>

export default meta
type Story = StoryObj<typeof meta>

export const ShowingAll: Story = {
  args: {
    value: 'all',
  },
}

export const FilteredByTeam: Story = {
  args: {
    value: 'team',
  },
}

export const Interactive: Story = {
  args: {
    value: 'all',
  },
  render: (args) => {
    const [value, setValue] = useState<TeamPreferenceScope>('all')

    return (
      <div className="flex flex-col gap-4">
        <TeamPreferenceFilter {...args} value={value} onChange={setValue} />
        <pre className="rounded-md bg-tertiary-background p-3 text-xs text-dark-brown">
          {JSON.stringify({ value }, null, 2)}
        </pre>
      </div>
    )
  },
}
