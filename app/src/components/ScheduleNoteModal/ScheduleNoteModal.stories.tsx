import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { ScheduleNoteModal } from './ScheduleNoteModal'

const meta = {
  title: 'Schedule/ScheduleNoteModal',
  component: ScheduleNoteModal,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    open: true,
    onClose: fn(),
    activityTitle: 'Palestra: O amor de Deus',
    body: '',
    onBodyChange: fn(),
    onSubmit: fn(),
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ScheduleNoteModal>

export default meta
type Story = StoryObj<typeof meta>

/** Empty, with the counter at zero. Typing hands the body back. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    // The dialog is portalled to the body, so the canvas element is empty.
    const screen = within(canvasElement.ownerDocument.body)

    await expect(screen.getByText('0/500')).toBeVisible()
    await userEvent.type(screen.getByRole('textbox'), 'O')
    await expect(args.onBodyChange).toHaveBeenCalledWith('O')
  },
}

/** A body written: the counter follows it and the note can be saved. */
export const Written: Story = {
  args: {
    body: 'Levar os violões para o salão antes das 18h.',
  },
  play: async ({ args, canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)

    await expect(screen.getByText('44/500')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Salvar nota' }))
    await expect(args.onSubmit).toHaveBeenCalledOnce()
  },
}

/** Past the limit: the counter turns red and the error says why. */
export const OverLimit: Story = {
  args: {
    body: 'a'.repeat(501),
    error: 'A nota pode ter até 500 caracteres',
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)

    await expect(screen.getByText('501/500')).toHaveClass('text-red')
    await expect(screen.getByText('A nota pode ter até 500 caracteres')).toBeVisible()
  },
}

/** Saving: both buttons are disabled. */
export const Submitting: Story = {
  args: {
    body: 'Levar os violões.',
    isSubmitting: true,
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)

    await expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled()
    await expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  },
}
