import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { FeeStatusReviewModal } from './FeeStatusReviewModal'
import { buildEventFeeMemberRow } from '../TeamMembersFeeCard/feeMemberMocks'
import type { ReviewableFeeStatus } from './feeReviewOptions'
import type { EventFeeMemberRow } from '../../services/finance/finance.types'

const paidMember = buildEventFeeMemberRow({
  userId: 'u-1',
  name: 'Maria Silva',
  nickname: 'Mari',
  teamId: 't-3',
  teamKey: 'liturgia',
  teamName: 'Liturgia',
  status: 'paid',
  paymentStatus: 'paid',
})

const exemptMember: EventFeeMemberRow = { ...paidMember, paymentStatus: 'exempt' }

const pendingMember: EventFeeMemberRow = {
  ...paidMember,
  status: 'pending',
  paymentStatus: 'pending',
}

const meta = {
  title: 'Financial/FeeStatusReviewModal',
  component: FeeStatusReviewModal,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    open: true,
    onClose: fn(),
    onSave: fn(),
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FeeStatusReviewModal>

export default meta
type Story = StoryObj<typeof meta>

/**
 * A member who has already paid: the matching option opens selected, and
 * "Salvar" is inert until the treasurer actually decides something different.
 */
export const PaidMember: Story = {
  args: {
    member: paidMember,
  },
  play: async ({ canvasElement }) => {
    // The dialog is portalled to the body, so the canvas element is empty.
    const screen = within(canvasElement.ownerDocument.body)

    await expect(screen.getByText('Mari')).toBeVisible()
    await expect(screen.getByText('Maria Silva')).toBeVisible()
    await expect(screen.getByText('Liturgia')).toBeVisible()
    await expect(screen.getByText('Pago')).toBeVisible()

    await expect(screen.getByRole('radio', { name: /Confirmar pagamento/ })).toBeChecked()
    await expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled()
  },
}

/**
 * A comped member. The table folds this into "Pago"; the dialog is the one place
 * that says "Isento", which is the whole reason the row carries both readings.
 */
export const ExemptMember: Story = {
  args: {
    member: exemptMember,
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)

    await expect(screen.getByText('Isento')).toBeVisible()
    await expect(screen.getByRole('radio', { name: /Isentar taxa/ })).toBeChecked()
    await expect(screen.getByRole('radio', { name: /Confirmar pagamento/ })).not.toBeChecked()
  },
}

/**
 * Nothing recorded yet — the majority of members, who have no payment row at
 * all. No option is true of them, so none is preselected and any choice is
 * already a change.
 */
export const PendingMember: Story = {
  args: {
    member: pendingMember,
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)

    for (const radio of screen.getAllByRole('radio')) {
      await expect(radio).not.toBeChecked()
    }

    await expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled()
  },
}

/** Both buttons go inert while the write is in flight, so it cannot be double-sent. */
export const Saving: Story = {
  args: {
    member: paidMember,
    isSaving: true,
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)

    await expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled()
    await expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  },
}

export const Cancelling: Story = {
  args: {
    member: paidMember,
  },
  play: async ({ args, canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    await expect(args.onClose).toHaveBeenCalled()
    await expect(args.onSave).not.toHaveBeenCalled()
  },
}

function InteractiveExample(props: { member: EventFeeMemberRow; onSave: (s: string) => void }) {
  const [open, setOpen] = useState(true)

  return (
    <FeeStatusReviewModal
      open={open}
      member={props.member}
      onClose={() => setOpen(false)}
      onSave={(status: ReviewableFeeStatus) => {
        props.onSave(status)
        setOpen(false)
      }}
    />
  )
}

/**
 * Picking a different status is what enables "Salvar" — and picking the original
 * one back disables it again, so a treasurer who changes their mind twice cannot
 * send a write that changes nothing.
 */
export const ChangingTheStatus: Story = {
  args: {
    member: paidMember,
  },
  render: (args) => <InteractiveExample member={paidMember} onSave={args.onSave} />,
  play: async ({ args, canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)
    const save = screen.getByRole('button', { name: 'Salvar' })

    await expect(save).toBeDisabled()

    await userEvent.click(screen.getByRole('radio', { name: /Isentar taxa/ }))
    await expect(save).toBeEnabled()

    await userEvent.click(screen.getByRole('radio', { name: /Confirmar pagamento/ }))
    await expect(save).toBeDisabled()

    await userEvent.click(screen.getByRole('radio', { name: /Marcar como não pago/ }))
    await userEvent.click(save)

    await expect(args.onSave).toHaveBeenCalledWith('not_paid')
  },
}
