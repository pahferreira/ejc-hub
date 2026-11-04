import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { NewScheduleDayModal } from './NewScheduleDayModal'

const meta = {
  title: 'Schedule/NewScheduleDayModal',
  component: NewScheduleDayModal,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    open: true,
    onClose: fn(),
    dateOptions: ['2026-04-03', '2026-04-04', '2026-04-05'],
    date: '',
    onDateChange: fn(),
    minDate: '2026-04-03',
    maxDate: '2026-04-05',
    onSubmit: fn(),
  },
  tags: ['autodocs'],
} satisfies Meta<typeof NewScheduleDayModal>

export default meta
type Story = StoryObj<typeof meta>

/** One chip per free event date. Picking one fills the date. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    // The dialog is portalled to the body, so the canvas element is empty.
    const screen = within(canvasElement.ownerDocument.body)

    await userEvent.click(screen.getByRole('button', { name: 'Sábado, 04 abr' }))
    await expect(args.onDateChange).toHaveBeenCalledWith('2026-04-04')
  },
}

/** A picked chip is highlighted and the date input shows it. */
export const Picked: Story = {
  args: {
    date: '2026-04-04',
  },
  play: async ({ args, canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)

    await userEvent.click(screen.getByRole('button', { name: 'Criar dia' }))
    await expect(args.onSubmit).toHaveBeenCalledOnce()
  },
}

/** Every event date already has a day: only the date input is left. */
export const NoFreeDates: Story = {
  args: {
    dateOptions: [],
  },
}

/** Submitted without a date. */
export const MissingDate: Story = {
  args: {
    error: 'Escolha a data do dia',
  },
}
