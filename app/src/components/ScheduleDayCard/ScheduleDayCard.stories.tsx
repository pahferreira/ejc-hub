import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { ScheduleDayCard } from './ScheduleDayCard'

const meta = {
  title: 'Schedule/ScheduleDayCard',
  component: ScheduleDayCard,
  args: {
    dayNumber: 1,
    date: '2026-04-03',
    isSelected: false,
    onSelect: fn(),
  },
  decorators: [
    (Story) => (
      <div role="tablist" aria-label="Dias do cronograma">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof ScheduleDayCard>

export default meta
type Story = StoryObj<typeof meta>

/** "DIA 1 · SEX", "Sexta", "3 Abr 2026". Clicking selects the day. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('DIA 1 · SEX')).toBeVisible()
    await expect(canvas.getByText('Sexta')).toBeVisible()
    await expect(canvas.getByText('3 Abr 2026')).toBeVisible()
    await userEvent.click(canvas.getByRole('tab'))
    await expect(args.onSelect).toHaveBeenCalled()
  },
}

/** The selected day is highlighted. */
export const Selected: Story = {
  args: { isSelected: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('tab')).toHaveAttribute('aria-selected', 'true')
  },
}
