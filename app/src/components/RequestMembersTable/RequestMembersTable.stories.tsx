import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { RequestMembersTable } from './RequestMembersTable'
import type { RequestMemberRow } from './requestMembersColumns'

function buildRow(overrides: Partial<RequestMemberRow> & Pick<RequestMemberRow, 'userId'>) {
  const row: RequestMemberRow = {
    name: 'Maria Silva',
    nickname: 'Mari',
    pictureUrl: null,
    experienceType: 'experienced_outsider',
    circleKey: null,
    areas: ['Comunicação'],
    preferences: [{ teamInstanceId: 't-1', name: 'Liturgia' }],
    rowStatus: 'requestable',
    ...overrides,
  }

  return row
}

/**
 * One of each `rowStatus`, plus a fourth person with no skills and no
 * preferences — the "—" states — and a fifth with four preferences, to show
 * the avatar stack capping at three.
 */
const mixedRows: RequestMemberRow[] = [
  buildRow({
    userId: 'u-1',
    name: 'João Santos',
    nickname: 'Joca',
    rowStatus: 'requestable',
    experienceType: 'newbie',
    circleKey: 'green',
    areas: ['Música', 'Canto'],
  }),
  buildRow({
    userId: 'u-2',
    name: 'Beatriz Nunes',
    nickname: 'Bia',
    rowStatus: 'requested',
    experienceType: 'experienced',
    areas: ['Acolhimento'],
    preferences: [
      { teamInstanceId: 't-1', name: 'Liturgia' },
      { teamInstanceId: 't-2', name: 'Acolhida' },
    ],
  }),
  // `assigned` is unreachable in production today (plan decision D2): nobody
  // holding a membership reaches this list. This row is this component's only
  // witness that the branch renders the right label at all.
  buildRow({
    userId: 'u-3',
    name: 'Lucas Andrade',
    nickname: 'Luquinhas',
    rowStatus: 'assigned',
    experienceType: 'experienced_outsider',
  }),
  buildRow({
    userId: 'u-4',
    name: 'Pedro Henrique',
    nickname: 'Pedrão',
    rowStatus: 'requestable',
    areas: [],
    preferences: [],
  }),
  buildRow({
    userId: 'u-5',
    name: 'Júlia Barbosa',
    nickname: 'Ju',
    rowStatus: 'requestable',
    preferences: [
      { teamInstanceId: 't-1', name: 'Liturgia' },
      { teamInstanceId: 't-2', name: 'Acolhida' },
      { teamInstanceId: 't-3', name: 'Cozinha' },
      { teamInstanceId: 't-4', name: 'Som e Iluminação' },
    ],
  }),
]

const meta = {
  title: 'MemberRequests/RequestMembersTable',
  component: RequestMembersTable,
  parameters: {
    layout: 'padded',
  },
  args: {
    onRequest: fn(),
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RequestMembersTable>

export default meta
type Story = StoryObj<typeof meta>

/** One row per `rowStatus`, plus the "no skills / no preferences" and "4+ preferences" edges. */
export const Default: Story = {
  args: {
    rows: mixedRows,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('button', { name: 'Solicitar Joca' })).toBeEnabled()
    await expect(
      canvas.getByRole('button', { name: 'Solicitação enviada para Bia' })
    ).toBeDisabled()
    await expect(
      canvas.getByRole('button', { name: 'Luquinhas já está em uma equipe' })
    ).toBeDisabled()
  },
}

/** Only `requestable` rows: every action is the enabled "Solicitar" button. */
export const AllRequestable: Story = {
  args: {
    rows: [
      buildRow({ userId: 'u-1', name: 'Maria Silva', nickname: 'Mari' }),
      buildRow({ userId: 'u-2', name: 'João Santos', nickname: 'Joca' }),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getAllByRole('button', { name: /^Solicitar/ })).toHaveLength(2)
  },
}

/** This team already asked for both — disabled, clock icon, tinted row. */
export const AllRequested: Story = {
  args: {
    rows: [
      buildRow({ userId: 'u-1', name: 'Maria Silva', nickname: 'Mari', rowStatus: 'requested' }),
      buildRow({ userId: 'u-2', name: 'João Santos', nickname: 'Joca', rowStatus: 'requested' }),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getAllByRole('button', { name: /^Solicitação enviada para/ })).toHaveLength(
      2
    )
  },
}

/**
 * `assigned` — a person already on a team. Unreachable in production behind
 * decision D2, so this row is this component's only witness that the branch
 * exists and reads correctly.
 */
export const AllAssigned: Story = {
  args: {
    rows: [
      buildRow({
        userId: 'u-1',
        name: 'Lucas Andrade',
        nickname: 'Luquinhas',
        rowStatus: 'assigned',
      }),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(
      canvas.getByRole('button', { name: 'Luquinhas já está em uma equipe' })
    ).toBeDisabled()
  },
}

export const Empty: Story = {
  args: {
    rows: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Once for the table, once for the stacked list — CSS hides one of the
    // two, so each layout carries its own empty state.
    await expect(canvas.getAllByText('Nenhum inscrito encontrado.')).toHaveLength(2)
  },
}

/** Below `md` the table is replaced by stacked rows, matching `EventFeeMembersTable`. */
export const MobileList: Story = {
  args: {
    rows: mixedRows,
  },
  globals: {
    viewport: { value: 'mobile1', isRotated: false },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const items = canvas.getAllByRole('listitem', { hidden: true })

    await expect(items).toHaveLength(mixedRows.length)
    await expect(items[0]).toHaveTextContent('Joca')
  },
}
