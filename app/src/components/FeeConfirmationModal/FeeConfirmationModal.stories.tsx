import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { FeeConfirmationModal } from './FeeConfirmationModal'

const meta = {
  title: 'Financial/FeeConfirmationModal',
  component: FeeConfirmationModal,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    open: true,
    onClose: fn(),
    onConfirm: fn(),
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FeeConfirmationModal>

export default meta
type Story = StoryObj<typeof meta>

/** One row's "Confirmar" button. The sentence names the member; no list. */
export const SingleMember: Story = {
  args: {
    memberNames: ['Mari (Maria Silva)'],
  },
  play: async ({ canvasElement }) => {
    // The dialog is portalled to the body, so the canvas element is empty.
    const screen = within(canvasElement.ownerDocument.body)

    await expect(screen.getByText('Confirmar pagamento')).toBeVisible()
    await expect(screen.getByText('Mari (Maria Silva)')).toBeVisible()
    await expect(screen.queryByRole('list')).not.toBeInTheDocument()
  },
}

/** The bulk bar's action: the count in the sentence, the names spelled out. */
export const MultipleMembers: Story = {
  args: {
    memberNames: ['Luquinhas (Lucas Andrade)', 'Ju (Júlia Barbosa)', 'Bia (Beatriz Nunes)'],
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)

    await expect(screen.getByText('Confirmar pagamentos')).toBeVisible()
    await expect(screen.getByText('3 membros')).toBeVisible()
    await expect(screen.getAllByRole('listitem')).toHaveLength(3)
  },
}

/** Both buttons go inert while the write is in flight, so it cannot be double-sent. */
export const Confirming: Story = {
  args: {
    memberNames: ['Mari (Maria Silva)'],
    isConfirming: true,
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)

    await expect(screen.getByRole('button', { name: 'Confirmando...' })).toBeDisabled()
    await expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  },
}

export const Cancelling: Story = {
  args: {
    memberNames: ['Mari (Maria Silva)'],
  },
  play: async ({ args, canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    await expect(args.onClose).toHaveBeenCalled()
    await expect(args.onConfirm).not.toHaveBeenCalled()
  },
}
