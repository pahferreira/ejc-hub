import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { RequestMemberModal } from './RequestMemberModal'
import type { RequestMemberRow } from '../RequestMembersTable/requestMembersColumns'

const member: RequestMemberRow = {
  userId: 'u-1',
  name: 'Maria Silva',
  nickname: 'Mari',
  pictureUrl: null,
  experienceType: 'experienced_outsider',
  circleKey: null,
  areas: ['Comunicação', 'Acolhimento'],
  preferences: [{ teamInstanceId: 't-1', name: 'Liturgia' }],
  rowStatus: 'requestable',
}

const meta = {
  title: 'MemberRequests/RequestMemberModal',
  component: RequestMemberModal,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    open: true,
    member,
    freeSlots: 7,
    onClose: fn(),
    onSubmit: fn(),
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RequestMemberModal>

export default meta
type Story = StoryObj<typeof meta>

/** "Enviar solicitação" starts inert — no reason typed yet. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    // The dialog is portalled to the body, so the canvas element is empty.
    const screen = within(canvasElement.ownerDocument.body)

    await expect(screen.getByText('Mari')).toBeVisible()
    await expect(screen.getByText('Maria Silva')).toBeVisible()
    await expect(screen.getByText('7 vagas restantes')).toBeVisible()
    await expect(screen.getByText('0/400')).toBeVisible()
    await expect(screen.getByRole('button', { name: 'Enviar solicitação' })).toBeDisabled()
  },
}

/** Typing a reason enables the button; submitting sends the trimmed message. */
export const FillingTheReason: Story = {
  play: async ({ args, canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)

    // `TextArea` renders no `id`, so its `<label>` is not programmatically
    // associated with the field — the placeholder is the reliable query here.
    const textarea = screen.getByPlaceholderText(
      'Explique por que este membro é necessário na sua equipe'
    )
    await userEvent.type(textarea, '  Precisamos de alguém com experiência em som.  ')

    await expect(screen.getByRole('button', { name: 'Enviar solicitação' })).toBeEnabled()

    await userEvent.click(screen.getByRole('button', { name: 'Enviar solicitação' }))
    await expect(args.onSubmit).toHaveBeenCalledWith('Precisamos de alguém com experiência em som.')
  },
}

/** One vaga left: singular copy, not "1 vagas restantes". */
export const OneSlotLeft: Story = {
  args: {
    freeSlots: 1,
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)

    await expect(screen.getByText('1 vaga restante')).toBeVisible()
  },
}

/**
 * Capacity is warn-but-allow everywhere else in this codebase (plan G.5): the
 * modal still lets a coordinator ask, and the admin decides.
 */
export const NoSlotsLeft: Story = {
  args: {
    freeSlots: 0,
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)

    await expect(screen.getByText('0 vagas restantes')).toBeVisible()
  },
}

/** Both buttons go inert while the write is in flight, so it cannot be double-sent. */
export const Submitting: Story = {
  args: {
    isSaving: true,
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)

    await expect(screen.getByRole('button', { name: 'Enviando...' })).toBeDisabled()
    await expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  },
}

export const Cancelling: Story = {
  play: async ({ args, canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    await expect(args.onClose).toHaveBeenCalled()
    await expect(args.onSubmit).not.toHaveBeenCalled()
  },
}
