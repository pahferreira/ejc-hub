import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { DeleteMeetingModal } from './DeleteMeetingModal'

const meta = {
  title: 'Attendance/DeleteMeetingModal',
  component: DeleteMeetingModal,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    open: true,
    meetingLabel: 'Ensaio geral',
    onClose: fn(),
    onConfirm: fn(),
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DeleteMeetingModal>

export default meta
type Story = StoryObj<typeof meta>

/** Names the meeting and warns that it leaves every rate. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    // The dialog is portalled to the body, so the canvas element is empty.
    const screen = within(canvasElement.ownerDocument.body)

    await expect(screen.getByText('Ensaio geral')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Excluir reunião' }))
    await expect(args.onConfirm).toHaveBeenCalledOnce()
  },
}

/** While the delete is in flight both buttons are disabled. */
export const Deleting: Story = {
  args: {
    isDeleting: true,
  },
}
