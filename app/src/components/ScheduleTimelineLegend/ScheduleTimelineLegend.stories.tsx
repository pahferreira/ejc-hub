import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { ScheduleTimelineLegend } from './ScheduleTimelineLegend'

const meta = {
  title: 'Schedule/ScheduleTimelineLegend',
  component: ScheduleTimelineLegend,
  tags: ['autodocs'],
} satisfies Meta<typeof ScheduleTimelineLegend>

export default meta
type Story = StoryObj<typeof meta>

/** The three row tones. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('No horário')).toBeVisible()
    await expect(canvas.getByText('Atrasada')).toBeVisible()
    await expect(canvas.getByText('Adiantada')).toBeVisible()
  },
}
