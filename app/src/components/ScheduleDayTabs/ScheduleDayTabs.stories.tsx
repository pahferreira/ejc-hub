import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { ScheduleDayTabs } from './ScheduleDayTabs'

const meta = {
  title: 'Schedule/ScheduleDayTabs',
  component: ScheduleDayTabs,
  args: {
    days: [
      { id: 'day-fri', date: '2026-04-03', activityCount: 7 },
      { id: 'day-sat', date: '2026-04-04', activityCount: 1 },
      { id: 'day-sun', date: '2026-04-05', activityCount: 0 },
    ],
    selectedDayId: 'day-fri',
    onSelectDay: fn(),
    onNewDay: fn(),
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ScheduleDayTabs>

export default meta
type Story = StoryObj<typeof meta>

/** Three days, the first selected. Counts agree in number: "1 atividade". */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('tab', { name: /Sexta/ })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await expect(canvas.getByText(/04 abr · 1 atividade$/)).toBeVisible()
    await userEvent.click(canvas.getByRole('tab', { name: /Domingo/ }))
    await expect(args.onSelectDay).toHaveBeenCalledWith('day-sun')
  },
}

/** No days yet: only the "+ Novo dia" tab. */
export const NoDays: Story = {
  args: {
    days: [],
    selectedDayId: null,
  },
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /Novo dia/ }))
    await expect(args.onNewDay).toHaveBeenCalledOnce()
  },
}
