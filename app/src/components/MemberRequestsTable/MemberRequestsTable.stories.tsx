import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { MemberRequestsTable } from './MemberRequestsTable'
import type { MemberRequestQueueRow } from '../../services/member-requests/member-requests.types'

function buildRow(
  overrides: Partial<MemberRequestQueueRow> & Pick<MemberRequestQueueRow, 'id'>
): MemberRequestQueueRow {
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
    team: { id: 't-1', name: 'Liturgia', freeSlots: 7 },
    requestedBy: { name: 'João Santos', nickname: 'Joca' },
    message: 'Precisamos de alguém com experiência em canto.',
    requestedAt: '2026-09-20T12:00:00.000Z',
    resolvedAt: null,
    resolvedBy: null,
    resolutionReason: null,
    otherPendingRequests: [],
    ...overrides,
  }
}

/**
 * The queue as an admin usually meets it: pending requests, one of them
 * contested, plus the two resolved outcomes so the status badges and the
 * absence of row actions on answered rows are both visible.
 */
const mixedRows: MemberRequestQueueRow[] = [
  buildRow({
    id: 'r-1',
    user: {
      userId: 'u-1',
      name: 'Beatriz Nunes',
      nickname: 'Bia',
      pictureUrl: null,
      experienceType: 'newbie',
      circleKey: 'green',
    },
    team: { id: 't-1', name: 'Liturgia', freeSlots: 7 },
  }),
  // Contested: two other teams want the same person. Approving this one closes
  // both of theirs as `outdated` (plan D8) — the row is tinted and carries the
  // `+ 2 equipes` pill.
  buildRow({
    id: 'r-2',
    user: {
      userId: 'u-2',
      name: 'Carlos Lima',
      nickname: 'Cacá',
      pictureUrl: null,
      experienceType: 'experienced',
      circleKey: null,
    },
    team: { id: 't-2', name: 'Acolhida', freeSlots: 1 },
    requestedBy: { name: 'Ana Souza' },
    otherPendingRequests: [
      { id: 'r-9', team: { id: 't-3', name: 'Música' }, requestedBy: { name: 'Pedro Alves' } },
      { id: 'r-10', team: { id: 't-4', name: 'Cozinha' }, requestedBy: { name: 'Lúcia Dias' } },
    ],
  }),
  buildRow({
    id: 'r-3',
    status: 'approved',
    user: {
      userId: 'u-3',
      name: 'Daniela Rocha',
      nickname: 'Dani',
      pictureUrl: null,
      experienceType: 'experienced_outsider',
      circleKey: null,
    },
    team: { id: 't-3', name: 'Música', freeSlots: 0 },
    resolvedAt: '2026-09-21T12:00:00.000Z',
    resolvedBy: { name: 'Admin Geral' },
  }),
  buildRow({
    id: 'r-4',
    status: 'denied',
    user: {
      userId: 'u-4',
      name: 'Eduardo Pinto',
      nickname: 'Du',
      pictureUrl: null,
      experienceType: 'experienced',
      circleKey: null,
    },
    resolvedAt: '2026-09-21T12:00:00.000Z',
    resolvedBy: { name: 'Admin Geral' },
    resolutionReason: 'A equipe já está completa.',
  }),
  // The system's own closure: a rival request that lost. Null `resolvedBy`
  // because nobody decided it — reads "Sem efeito", never "Negada".
  buildRow({
    id: 'r-5',
    status: 'outdated',
    user: {
      userId: 'u-5',
      name: 'Fernanda Melo',
      nickname: 'Fê',
      pictureUrl: null,
      experienceType: 'experienced',
      circleKey: null,
    },
    team: { id: 't-4', name: 'Cozinha', freeSlots: 3 },
    resolvedAt: '2026-09-21T12:00:00.000Z',
    resolutionReason: 'Alocado em outra equipe',
  }),
]

const meta = {
  title: 'MemberRequests/MemberRequestsTable',
  component: MemberRequestsTable,
  parameters: { layout: 'padded' },
  args: {
    rows: mixedRows,
    canResolve: true,
    onApprove: fn(),
    onDeny: fn(),
  },
} satisfies Meta<typeof MemberRequestsTable>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/**
 * Only `pending` rows carry buttons: the five rows here produce two pairs, not
 * five. An answered request is a record, not a decision.
 */
export const OnlyPendingRowsAreActionable: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Two pending rows in `mixedRows`, so one pair each. The `md:hidden` mobile
    // list renders the same rows again, but `findAllByRole` walks the
    // accessibility tree, which excludes it at this viewport.
    const approveButtons = await canvas.findAllByRole('button', { name: /^Aprovar solicitação de/ })
    const denyButtons = await canvas.findAllByRole('button', { name: /^Negar solicitação de/ })

    expect(approveButtons).toHaveLength(2)
    expect(denyButtons).toHaveLength(2)

    // The approved, denied and outdated rows offer nothing to click.
    expect(canvas.queryByRole('button', { name: /Dani/ })).toBeNull()
    expect(canvas.queryByRole('button', { name: /Du/ })).toBeNull()
    expect(canvas.queryByRole('button', { name: /Fê/ })).toBeNull()
  },
}

/** A contested request: the `+ N equipes` pill and the tinted row. */
export const Disputed: Story = {
  args: { rows: [mixedRows[1]] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const pills = await canvas.findAllByText('+ 2 equipes')

    // Desktop and mobile both render it.
    expect(pills.length).toBeGreaterThan(0)
  },
}

/**
 * A viewer with read-but-not-write permission. The `AÇÃO` column is dropped
 * entirely rather than disabled (plan H.7).
 */
export const WithoutWritePermission: Story = {
  args: { canResolve: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    expect(canvas.queryByRole('columnheader', { name: 'Ação' })).toBeNull()
    expect(canvas.queryByRole('button', { name: /^Aprovar solicitação de/ })).toBeNull()
  },
}

/** The good-news empty state: nothing waiting. */
export const EmptyQueue: Story = {
  args: {
    rows: [],
    emptyMessage: 'Nenhuma solicitação pendente. Tudo em dia.',
  },
}

/** Below `md` the table is replaced by stacked rows, matching `RequestMembersTable`. */
export const MobileList: Story = {
  globals: {
    viewport: { value: 'mobile1', isRotated: false },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const items = canvas.getAllByRole('listitem', { hidden: true })

    expect(items).toHaveLength(mixedRows.length)
    expect(items[0]).toHaveTextContent('Bia')
  },
}
