import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { MyTeamRequestsList } from './MyTeamRequestsList'
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

const rows: MyTeamRequestRow[] = [
  buildRow({ id: 'r-1' }),
  buildRow({
    id: 'r-2',
    status: 'approved',
    user: {
      userId: 'u-2',
      name: 'Bruno Carvalho',
      nickname: 'Bru',
      pictureUrl: null,
      experienceType: 'experienced',
      circleKey: null,
    },
    resolvedAt: '2026-09-21T12:00:00.000Z',
  }),
  buildRow({
    id: 'r-3',
    status: 'denied',
    user: {
      userId: 'u-3',
      name: 'Carla Dias',
      nickname: 'Carla',
      pictureUrl: null,
      experienceType: 'experienced',
      circleKey: null,
    },
    resolvedAt: '2026-09-21T12:00:00.000Z',
    resolutionReason: 'A equipe já está completa.',
  }),
]

const meta = {
  title: 'MemberRequests/MyTeamRequestsList',
  component: MyTeamRequestsList,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof MyTeamRequestsList>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { rows },
}

export const Empty: Story = {
  args: { rows: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    expect(canvas.getByText('Nenhuma solicitação feita ainda.')).toBeInTheDocument()
  },
}

export const EmptyFiltered: Story = {
  args: { rows: [], emptyMessage: 'Nenhuma solicitação encontrada com os filtros atuais.' },
}
