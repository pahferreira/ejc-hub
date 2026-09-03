import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { FeeByTeamCard } from './FeeByTeamCard'
import { eventFeeOverviewMock, teamFeeRowsMock } from '../../services/finance/finance.mocks'

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

export const Default: Story = {
  args: {
    rows: teamFeeRowsMock,
    overallPaidPercentage: eventFeeOverviewMock.paidPercentage,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('18 equipes · clique no cabeçalho para ordenar')).toBeVisible()

    // Defaults to alphabetical by team
    await expect(canvas.getByRole('columnheader', { name: /equipe/i })).toHaveAttribute(
      'aria-sort',
      'ascending'
    )
    await expect(canvas.getAllByRole('row')[1]).toHaveTextContent('Acolhida')

    // Progresso is presentational, so it carries no sort affordance
    await expect(canvas.getByRole('columnheader', { name: 'Progresso' })).not.toHaveAttribute(
      'aria-sort'
    )
  },
}

/**
 * Numeric columns sort descending on the first click, so one click on
 * "Pendentes" surfaces the teams with the most outstanding fees.
 */
export const SortedByPendingDescending: Story = {
  args: {
    rows: teamFeeRowsMock,
    overallPaidPercentage: eventFeeOverviewMock.paidPercentage,
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
      teamFeeRowsMock[0],
      {
        teamId: 'team-99',
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

    await expect(canvas.getByText('Nenhuma equipe encontrada.')).toBeVisible()
    await expect(canvas.getByText('0 equipes · clique no cabeçalho para ordenar')).toBeVisible()
  },
}
