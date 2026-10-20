import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { MyTeamRequestCard } from './MyTeamRequestCard'
import type { MyTeamRequestRow } from '../../services/member-requests/member-requests.types'

function buildRow(
  overrides: Partial<MyTeamRequestRow> & Pick<MyTeamRequestRow, 'id'>
): MyTeamRequestRow {
  return {
    status: 'pending',
    user: {
      userId: 'u-1',
      name: 'Maria Silva',
      nickname: 'Mari',
      pictureUrl: null,
      experienceType: 'experienced',
      circleKey: null,
    },
    requestedBy: { name: 'João Santos', nickname: 'João' },
    message: null,
    requestedAt: '2026-09-20T12:00:00.000Z',
    resolvedAt: null,
    resolutionReason: null,
    ...overrides,
  }
}

const meta = {
  title: 'MemberRequests/MyTeamRequestCard',
  component: MyTeamRequestCard,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof MyTeamRequestCard>

export default meta

type Story = StoryObj<typeof meta>

/** Open: "Aguardando" badge, no response yet. */
export const Pending: Story = {
  args: {
    row: buildRow({
      id: 'r-1',
      message: 'Precisamos de alguém com experiência em canto.',
    }),
  },
}

/** Approved, with no admin-written reason — the generic fallback shows instead. */
export const Approved: Story = {
  args: {
    row: buildRow({
      id: 'r-2',
      status: 'approved',
      resolvedAt: '2026-09-21T12:00:00.000Z',
    }),
  },
}

/** Denied: the admin's `resolutionReason` is the whole point of this card. */
export const Denied: Story = {
  args: {
    row: buildRow({
      id: 'r-3',
      status: 'denied',
      resolvedAt: '2026-09-21T12:00:00.000Z',
      resolutionReason: 'A equipe já está completa.',
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    expect(canvas.getByText('A equipe já está completa.')).toBeInTheDocument()
  },
}

/** Superseded by another team's approval — the system-written reason, not a placeholder. */
export const Outdated: Story = {
  args: {
    row: buildRow({
      id: 'r-4',
      status: 'outdated',
      resolvedAt: '2026-09-21T12:00:00.000Z',
      resolutionReason: 'Alocado em outra equipe',
    }),
  },
}

/** Withdrawn — no `resolutionReason`, the cancellation-specific fallback shows. */
export const Cancelled: Story = {
  args: {
    row: buildRow({ id: 'r-5', status: 'cancelled', resolvedAt: '2026-09-21T12:00:00.000Z' }),
  },
}

/** Never renders the admin's name, even though the API could carry it (plan: resolvedBy dropped). */
export const DoesNotRenderResolvedBy: Story = {
  args: {
    row: buildRow({
      id: 'r-6',
      status: 'denied',
      resolvedAt: '2026-09-21T12:00:00.000Z',
      resolutionReason: 'Capacidade da equipe atingida.',
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    expect(canvas.queryByText(/Admin/)).toBeNull()
  },
}

/** A long, multiline reason keeps its line breaks and wraps inside the panel. */
export const LongMultilineMessage: Story = {
  args: {
    row: buildRow({
      id: 'r-5',
      message:
        'Precisamos de reforço na equipe para o encontro. A pessoa indicada tem experiência com canto e violão, já participou de outras edições e conhece a dinâmica da liturgia. Além disso, vários membros atuais estarão ausentes no fim de semana do evento por motivos de trabalho e viagem, o que deixa a equipe com menos gente do que o necessário para as atividades. Pedimos com urgência a alocação desta pessoa para que consigamos cobrir todos os horários previstos na programação.\n\nObrigado!',
    }),
  },
}

/** No reason on file: the panel shows the fallback instead of staying empty. */
export const NoMessage: Story = {
  args: {
    row: buildRow({ id: 'r-6', message: null }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    expect(canvas.getByText('Nenhum motivo informado.')).toBeInTheDocument()
  },
}
