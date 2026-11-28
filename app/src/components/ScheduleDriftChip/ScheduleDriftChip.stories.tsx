import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { ScheduleDriftChip } from './ScheduleDriftChip'

const meta = {
  title: 'Schedule/ScheduleDriftChip',
  component: ScheduleDriftChip,
  args: { tone: 'late', children: 'Atraso +12 min' },
  tags: ['autodocs'],
} satisfies Meta<typeof ScheduleDriftChip>

export default meta
type Story = StoryObj<typeof meta>

/** The day runs behind. */
export const Late: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Atraso +12 min')).toBeVisible()
  },
}

/** The day runs ahead. */
export const Early: Story = {
  args: { tone: 'early', children: 'Adiantado 5 min' },
}

/** The day is on time. */
export const OnTime: Story = {
  args: { tone: 'onTime', children: 'No horário' },
}
