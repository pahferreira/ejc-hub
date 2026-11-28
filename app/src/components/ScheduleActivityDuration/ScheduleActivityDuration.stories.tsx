import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { ScheduleActivityDuration } from './ScheduleActivityDuration'

const meta = {
  title: 'Schedule/ScheduleActivityDuration',
  component: ScheduleActivityDuration,
  args: {
    durationMinutes: 45,
    adjustedDurationMinutes: null,
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ScheduleActivityDuration>

export default meta
type Story = StoryObj<typeof meta>

/** No trim: the planned duration alone. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('45 min')).toBeVisible()
    await expect(canvasElement.querySelector('s')).toBeNull()
  },
}

/** Trimmed: the planned duration struck through, the trimmed one next to it. */
export const Trimmed: Story = {
  args: { adjustedDurationMinutes: 30 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByLabelText('Planejada: 45 min').tagName).toBe('S')
    await expect(canvas.getByLabelText('Ajustada: 30 min')).toBeVisible()
  },
}
