import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { ApproveRequestModal } from './ApproveRequestModal'
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
  title: 'MemberRequests/ApproveRequestModal',
  component: ApproveRequestModal,
  parameters: { layout: 'centered' },
  args: {
    open: true,
    request,
    onClose: fn(),
    onSubmit: fn(),
  },
} satisfies Meta<typeof ApproveRequestModal>

export default meta

type Story = StoryObj<typeof meta>

/** The uncontested case: no warning block, and the button is a plain "Aprovar". */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)

    expect(await canvas.findByRole('button', { name: 'Aprovar' })).toBeEnabled()
    expect(canvas.queryByText(/serão encerradas automaticamente/)).toBeNull()
  },
}

/**
 * One rival request. The button counts what it will close, and the copy says
 * **encerrar** / **sem efeito** — never *negar* (plan D8).
 */
export const DisputedByOneTeam: Story = {
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

    expect(await canvas.findByRole('button', { name: 'Aprovar e encerrar 1' })).toBeEnabled()
    expect(canvas.getByText('Há outra solicitação para este membro')).toBeVisible()
    expect(
      canvas.getByText('Ao aprovar esta, as demais serão encerradas automaticamente:')
    ).toBeVisible()
    expect(canvas.getByText('sem efeito')).toBeVisible()

    // The losers become `outdated`, so the word "negada" must appear nowhere.
    expect(canvas.queryByText(/negada/i)).toBeNull()
  },
}

/** Several rivals: the heading pluralises and every loser gets its own pill. */
export const DisputedBySeveralTeams: Story = {
  args: {
    request: {
      ...request,
      team: { id: 't-1', name: 'Liturgia', freeSlots: 1 },
      otherPendingRequests: [
        { id: 'r-9', team: { id: 't-2', name: 'Acolhida' }, requestedBy: { name: 'Ana Souza' } },
        { id: 'r-10', team: { id: 't-3', name: 'Música' }, requestedBy: { name: 'Pedro Alves' } },
        { id: 'r-11', team: { id: 't-4', name: 'Cozinha' }, requestedBy: { name: 'Lúcia Dias' } },
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)

    expect(await canvas.findByRole('button', { name: 'Aprovar e encerrar 3' })).toBeEnabled()
    expect(canvas.getByText('Há outras solicitações para este membro')).toBeVisible()
    expect(canvas.getAllByText('sem efeito')).toHaveLength(3)
  },
}

/**
 * A full team still approves. Capacity is warn-but-allow everywhere in this
 * codebase and is deliberately not enforced here (plan D12) — the admin
 * decides.
 */
export const TeamAlreadyFull: Story = {
  args: {
    request: { ...request, team: { id: 't-1', name: 'Liturgia', freeSlots: 0 } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)

    expect(await canvas.findByText(/0 vagas restantes/)).toBeVisible()
    expect(canvas.getByRole('button', { name: 'Aprovar' })).toBeEnabled()
  },
}

/** One free slot: singular. */
export const OneSlotLeft: Story = {
  args: {
    request: { ...request, team: { id: 't-1', name: 'Liturgia', freeSlots: 1 } },
  },
}

export const Approving: Story = {
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
