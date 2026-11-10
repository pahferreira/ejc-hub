import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { DeleteScheduleActivityModal } from './DeleteScheduleActivityModal'

const meta = {
  title: 'Schedule/DeleteScheduleActivityModal',
  component: DeleteScheduleActivityModal,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    open: true,
    activityTitle: 'Missa de abertura',
    onClose: fn(),
    onConfirm: fn(),
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DeleteScheduleActivityModal>

export default meta
type Story = StoryObj<typeof meta>

/** Names the activity and deletes only once confirmed. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    // The dialog is portalled to the body, so the canvas element is empty.
    const screen = within(canvasElement.ownerDocument.body)

    await expect(screen.getByText('Missa de abertura')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Excluir atividade' }))
    await expect(args.onConfirm).toHaveBeenCalledOnce()
  },
}

/** While the delete is in flight both buttons are disabled. */
export const Deleting: Story = {
  args: {
    isDeleting: true,
  },
}
