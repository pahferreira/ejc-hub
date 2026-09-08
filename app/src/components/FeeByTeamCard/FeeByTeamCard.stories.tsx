import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { FeeByTeamCard } from './FeeByTeamCard'
import type { TeamFeeRow } from '../../services/finance/finance.types'

const meta = {
  title: 'Financial/FeeByTeamCard',
  component: FeeByTeamCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FeeByTeamCard>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Totals reconcile to 119 members / 88 paid / 31 pending (74%), and the teams
 * deliberately span every tone: seven at 100%, one at exactly 50% to pin the
 * warning/error boundary, and four below it.
 */
const sampleRows: TeamFeeRow[] = [
  {
    teamId: '1',
    teamKey: 'acolhida',
    teamName: 'Acolhida',
    total: 7,
    paid: 3,
    pending: 4,
    paidPercentage: 43,
  },
  {
    teamId: '2',
    teamKey: 'animacao',
    teamName: 'Animação',
    total: 9,
    paid: 9,
    pending: 0,
    paidPercentage: 100,
  },
  {
    teamId: '3',
    teamKey: 'apoio',
    teamName: 'Apoio',
    total: 7,
    paid: 7,
    pending: 0,
    paidPercentage: 100,
  },
  {
    teamId: '4',
    teamKey: 'comunicacao',
    teamName: 'Comunicação',
    total: 6,
    paid: 6,
    pending: 0,
    paidPercentage: 100,
  },
  {
    teamId: '5',
    teamKey: 'cozinha',
    teamName: 'Cozinha',
    total: 15,
    paid: 7,
    pending: 8,
    paidPercentage: 47,
  },
  {
    teamId: '6',
    teamKey: 'decoracao',
    teamName: 'Decoração',
    total: 3,
    paid: 3,
    pending: 0,
    paidPercentage: 100,
  },
  {
    teamId: '7',
    teamKey: 'evangelizacao',
    teamName: 'Evangelização',
    total: 7,
    paid: 3,
    pending: 4,
    paidPercentage: 43,
  },
  {
    teamId: '8',
    teamKey: 'fotografia',
    teamName: 'Fotografia',
    total: 3,
    paid: 2,
    pending: 1,
    paidPercentage: 67,
  },
  {
    teamId: '9',
    teamKey: 'garcom',
    teamName: 'Garçom',
    total: 8,
    paid: 6,
    pending: 2,
    paidPercentage: 75,
  },
  {
    teamId: '10',
    teamKey: 'liturgia',
    teamName: 'Liturgia',
    total: 5,
    paid: 5,
    pending: 0,
    paidPercentage: 100,
  },
  {
    teamId: '11',
    teamKey: 'musica',
    teamName: 'Música',
    total: 7,
    paid: 6,
    pending: 1,
    paidPercentage: 86,
  },
  {
    teamId: '12',
    teamKey: 'ordem',
    teamName: 'Ordem',
    total: 6,
    paid: 3,
    pending: 3,
    paidPercentage: 50,
  },
  {
    teamId: '13',
    teamKey: 'oracao',
    teamName: 'Oração',
    total: 4,
    paid: 4,
    pending: 0,
    paidPercentage: 100,
  },
  {
    teamId: '14',
    teamKey: 'recepcao',
    teamName: 'Recepção',
    total: 6,
    paid: 5,
    pending: 1,
    paidPercentage: 83,
  },
  {
    teamId: '15',
    teamKey: 'secretaria',
    teamName: 'Secretaria',
    total: 4,
    paid: 4,
    pending: 0,
    paidPercentage: 100,
  },
  {
    teamId: '16',
    teamKey: 'som',
    teamName: 'Som',
    total: 5,
    paid: 2,
    pending: 3,
    paidPercentage: 40,
  },
  {
    teamId: '17',
    teamKey: 'tarefas',
    teamName: 'Tarefas',
    total: 9,
    paid: 7,
    pending: 2,
    paidPercentage: 78,
  },
  {
    teamId: '18',
    teamKey: 'vigilia',
    teamName: 'Vigília',
    total: 8,
    paid: 6,
    pending: 2,
    paidPercentage: 75,
  },
]

export const Default: Story = {
  args: {
    rows: sampleRows,
    overallPaidPercentage: 74,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Split assertions: the sort hint lives in its own span so it can be
    // hidden on phones, and `getByText` only reads an element's direct text.
    await expect(canvas.getByText('18 equipes')).toBeVisible()
    await expect(canvas.getByText('· clique no cabeçalho para ordenar')).toBeVisible()

    // Defaults to alphabetical by team
    await expect(canvas.getByRole('columnheader', { name: /equipe/i })).toHaveAttribute(
      'aria-sort',
      'ascending'
    )
    await expect(canvas.getAllByRole('row')[1]).toHaveTextContent('Acolhida')

    // Progresso is presentational, so it renders no sort button at all. Asserted
    // via the absent button rather than the header's aria-sort: the column is
    // display:none below 1440px, and a hidden subtree computes an empty
    // accessible name, so a name-based columnheader query cannot find it.
    await expect(canvas.queryByRole('button', { name: /progresso/i })).not.toBeInTheDocument()
  },
}

/**
 * Numeric columns sort descending on the first click, so one click on
 * "Pendentes" surfaces the teams with the most outstanding fees.
 */
export const SortedByPendingDescending: Story = {
  args: {
    rows: sampleRows,
    overallPaidPercentage: 74,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const pendingHeader = canvas.getByRole('button', { name: /pendentes/i })

    await userEvent.click(pendingHeader)

    await expect(canvas.getByRole('columnheader', { name: /pendentes/i })).toHaveAttribute(
      'aria-sort',
      'descending'
    )

    // Cozinha carries the most outstanding fees (8)
    await expect(canvas.getAllByRole('row')[1]).toHaveTextContent('Cozinha')

    // Clicking again flips to ascending, putting the settled teams on top
    await userEvent.click(pendingHeader)

    await expect(canvas.getByRole('columnheader', { name: /pendentes/i })).toHaveAttribute(
      'aria-sort',
      'ascending'
    )
    await expect(canvas.getAllByRole('row')[1]).toHaveTextContent('0')
  },
}

/** A team with no members yet sits at 0% but renders neutral rather than alarming. */
export const TeamWithoutMembers: Story = {
  args: {
    rows: [
      sampleRows[0],
      {
        teamId: '99',
        teamKey: 'nova-equipe',
        teamName: 'Nova Equipe',
        total: 0,
        paid: 0,
        pending: 0,
        paidPercentage: 0,
      },
    ],
    overallPaidPercentage: 43,
  },
}

export const Empty: Story = {
  args: {
    rows: [],
    overallPaidPercentage: 0,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Once for the table, once for the card list — one of the two is always
    // hidden by CSS, so both layouts carry their own empty state.
    await expect(canvas.getAllByText('Nenhuma equipe encontrada.')).toHaveLength(2)
    await expect(canvas.getByText('0 equipes')).toBeVisible()
  },
}

/**
 * Below `md` (768px) the table is replaced by stacked cards and a sort
 * selector, since there are no column headers to click. Between 768px and
 * 1440px the table returns without the `Progresso` column; at 1440px and up the
 * bar comes back.
 */
export const MobileCards: Story = {
  args: {
    rows: sampleRows,
    overallPaidPercentage: 74,
  },
  globals: {
    viewport: { value: 'mobile1', isRotated: false },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Queried with `hidden` so the assertion holds whatever width the test
    // runner uses: the card markup is rendered for every team either way.
    const items = canvas.getAllByRole('listitem', { hidden: true })

    await expect(items).toHaveLength(18)
    await expect(items[0]).toHaveTextContent('Acolhida')
    await expect(items[0]).toHaveTextContent('43%')
  },
}
