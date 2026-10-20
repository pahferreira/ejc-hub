import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { DenyRequestModal } from './DenyRequestModal'
import { MEMBER_REQUEST_MESSAGE_MAX } from '../../../../common/member-requests'
import type { MemberRequestQueueRow } from '../../services/member-requests/member-requests.types'

const request: MemberRequestQueueRow = {
  id: 'r-1',
  status: 'pending',
  user: {
    userId: 'u-1',
    name: 'Beatriz Nunes',
    nickname: 'Bia',
    pictureUrl: null,
    experienceType: 'newbie',
    circleKey: 'blue',
  },
  team: { id: 't-1', name: 'Liturgia', freeSlots: 7 },
  requestedBy: { name: 'João Santos', nickname: 'Joca' },
  message: 'Precisamos de alguém com experiência em canto.',
  requestedAt: '2026-09-20T12:00:00.000Z',
  resolvedAt: null,
  resolvedBy: null,
  resolutionReason: null,
  otherPendingRequests: [],
}

const meta = {
  title: 'MemberRequests/DenyRequestModal',
  component: DenyRequestModal,
  parameters: { layout: 'centered' },
  args: {
    open: true,
    request,
    onClose: fn(),
    onSubmit: fn(),
  },
} satisfies Meta<typeof DenyRequestModal>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** The reason is required: the button is inert until something is typed. */
export const SubmitBlockedUntilReasonIsTyped: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement.ownerDocument.body)
    const submit = await canvas.findByRole('button', { name: 'Negar solicitação' })

    expect(submit).toBeDisabled()

    await userEvent.type(
      canvas.getByPlaceholderText('Explique ao coordenador por que a solicitação foi negada'),
      'A equipe já está completa.'
    )

    expect(submit).toBeEnabled()
    await userEvent.click(submit)
    expect(args.onSubmit).toHaveBeenCalledWith('A equipe já está completa.')
  },
}

/** Whitespace is not a reason. */
export const WhitespaceIsNotAReason: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)

    await userEvent.type(
      canvas.getByPlaceholderText('Explique ao coordenador por que a solicitação foi negada'),
      '    '
    )

    expect(await canvas.findByRole('button', { name: 'Negar solicitação' })).toBeDisabled()
  },
}

/**
 * Over the cap: the counter turns red and the button goes inert at the same
 * instant, because both read the raw length.
 */
export const OverTheReasonCap: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)

    await userEvent.type(
      canvas.getByPlaceholderText('Explique ao coordenador por que a solicitação foi negada'),
      'a'.repeat(MEMBER_REQUEST_MESSAGE_MAX + 1),
      { delay: null }
    )

    expect(await canvas.findByRole('button', { name: 'Negar solicitação' })).toBeDisabled()
    expect(
      canvas.getByText(`${MEMBER_REQUEST_MESSAGE_MAX + 1}/${MEMBER_REQUEST_MESSAGE_MAX}`)
    ).toBeVisible()
  },
}

/**
 * The helper line is computed from how many other teams still want the person
 * — three separate sentences, not one template.
 */
export const WithOneRivalRequestStillPending: Story = {
  args: {
    request: {
      ...request,
      otherPendingRequests: [
        { id: 'r-9', team: { id: 't-2', name: 'Acolhida' }, requestedBy: { name: 'Ana Souza' } },
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)

    expect(
      await canvas.findByText(
        'O membro continuará na lista de espera com 1 solicitação pendente de outra equipe.'
      )
    ).toBeVisible()
  },
}

export const WithSeveralRivalRequestsStillPending: Story = {
  args: {
    request: {
      ...request,
      otherPendingRequests: [
        { id: 'r-9', team: { id: 't-2', name: 'Acolhida' }, requestedBy: { name: 'Ana Souza' } },
        { id: 'r-10', team: { id: 't-3', name: 'Música' }, requestedBy: { name: 'Pedro Alves' } },
      ],
    },
  },
}

export const Denying: Story = {
  args: { isSaving: true },
}

/** A long reason shows in full — no clamp, so the admin reads all of it. */
export const LongMessage: Story = {
  args: {
    request: {
      ...request,
      message:
        'Precisamos de reforço na equipe para o encontro. A pessoa indicada tem experiência com canto e violão, já participou de outras edições e conhece a dinâmica da liturgia. Além disso, vários membros atuais estarão ausentes no fim de semana do evento por motivos de trabalho e viagem, o que deixa a equipe com menos gente do que o necessário para as atividades. Pedimos com urgência a alocação desta pessoa para que consigamos cobrir todos os horários previstos na programação.',
    },
  },
}

/** Line breaks the coordinator typed are kept. */
export const MultilineMessage: Story = {
  args: {
    request: {
      ...request,
      message: 'Precisamos de alguém com experiência em canto.\nTambém toca violão.\n\nObrigado!',
    },
  },
}

/** No reason on file: the fallback copy shows. */
export const NoMessage: Story = {
  args: {
    request: { ...request, message: null },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)

    expect(await canvas.findByText('Nenhum motivo informado.')).toBeVisible()
  },
}
