import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { DeleteScheduleDayModal } from './DeleteScheduleDayModal'

const meta = {
  title: 'Schedule/DeleteScheduleDayModal',
  component: DeleteScheduleDayModal,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    open: true,
    dayLabel: 'Sexta, 03 abr',
    activityCount: 7,
    onClose: fn(),
    onConfirm: fn(),
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DeleteScheduleDayModal>

export default meta
type Story = StoryObj<typeof meta>

/** Names the day and warns that its activities go with it. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    // The dialog is portalled to the body, so the canvas element is empty.
    const screen = within(canvasElement.ownerDocument.body)

    await expect(screen.getByText('Sexta, 03 abr')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Excluir dia' }))
    await expect(args.onConfirm).toHaveBeenCalledOnce()
  },
}

/** A day with no activities only warns there is no undo. */
export const EmptyDay: Story = {
  args: {
    activityCount: 0,
  },
}

/** While the delete is in flight both buttons are disabled. */
export const Deleting: Story = {
  args: {
    isDeleting: true,
  },
}
