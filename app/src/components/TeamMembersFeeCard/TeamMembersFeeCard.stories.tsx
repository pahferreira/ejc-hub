import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { TeamMembersFeeCard } from './TeamMembersFeeCard'
import { buildMemberFeeRow, mixedMemberFeeRows } from './feeMemberMocks'
import { toggleMemberSelection, toggleSelectAllPending } from './feeMemberSelection'
import type { TeamMemberFeeRow } from '../../services/finance/finance.types'

const meta = {
  title: 'Financial/TeamMembersFeeCard',
  component: TeamMembersFeeCard,
  parameters: {
    layout: 'padded',
  },
  args: {
    onToggleMember: fn(),
    onToggleSelectAllPending: fn(),
    onConfirmMember: fn(),
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TeamMembersFeeCard>

export default meta
type Story = StoryObj<typeof meta>

const allPaidRows: TeamMemberFeeRow[] = mixedMemberFeeRows.map((row) => ({
  ...row,
  status: 'paid',
}))

const allPendingRows: TeamMemberFeeRow[] = mixedMemberFeeRows.map((row) => ({
  ...row,
  status: 'pending',
}))

/**
 * The design mock's state: 5 paid, 3 pending, 63%. Coordinators carry an extra
 * badge, and a member with no phone on file shows an em dash.
 */
export const Mixed: Story = {
  args: {
    rows: mixedMemberFeeRows,
    selectedIds: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(
      canvas.getByText(
        '3 pagamentos pendentes · selecione pendentes para confirmar todos de uma vez.'
      )
    ).toBeVisible()

    // Footer reconciles with the rows above it.
    await expect(canvas.getByText('pagos')).toBeVisible()
    await expect(canvas.getByText('63%')).toBeVisible()

    // Only the three pending members offer an action; the header toggle is the
    // only other checkbox, and paid rows expose no checkbox at all.
    await expect(canvas.getAllByRole('button', { name: /^Confirmar taxa de/ })).toHaveLength(3)
    await expect(canvas.getAllByRole('checkbox')).toHaveLength(4)

    await expect(canvas.getByRole('checkbox', { name: 'Selecionar Bia' })).not.toBeChecked()
    await expect(
      canvas.queryByRole('checkbox', { name: 'Selecionar Mari' })
    ).not.toBeInTheDocument()
  },
}

/** Nothing left to confirm: the bulk toggle is disabled rather than inert-but-clickable. */
export const AllPaid: Story = {
  args: {
    rows: allPaidRows,
    selectedIds: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(
      canvas.getByText(
        '0 pagamentos pendentes · selecione pendentes para confirmar todos de uma vez.'
      )
    ).toBeVisible()
    await expect(canvas.getByText('100%')).toBeVisible()

    const selectAll = canvas.getByRole('checkbox', { name: 'Selecionar pendentes' })

    await expect(selectAll).toBeDisabled()
    // Not vacuously checked, even though "every pending member" is selected.
    await expect(selectAll).not.toBeChecked()
    await expect(
      canvas.queryByRole('button', { name: /^Confirmar taxa de/ })
    ).not.toBeInTheDocument()
  },
}

/** Every fee outstanding — the toggle is available but not yet checked. */
export const AllPending: Story = {
  args: {
    rows: allPendingRows,
    selectedIds: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('0%')).toBeVisible()

    const selectAll = canvas.getByRole('checkbox', { name: 'Selecionar pendentes' })

    await expect(selectAll).toBeEnabled()
    await expect(selectAll).not.toBeChecked()
    await expect(canvas.getAllByRole('button', { name: /^Confirmar taxa de/ })).toHaveLength(8)
  },
}

/**
 * Uses the singular copy, which is the case a naive `${n} pagamentos pendentes`
 * template gets wrong.
 */
export const SinglePending: Story = {
  args: {
    rows: [
      buildMemberFeeRow({ userId: 'u-1', name: 'Maria Silva', nickname: 'Mari', status: 'paid' }),
      buildMemberFeeRow({ userId: 'u-2', name: 'João Santos', nickname: 'Joca' }),
    ],
    selectedIds: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(
      canvas.getByText(
        '1 pagamento pendente · selecione pendentes para confirmar todos de uma vez.'
      )
    ).toBeVisible()
  },
}

/** A partial selection leaves the header toggle unchecked. */
export const BulkSelectionActive: Story = {
  args: {
    rows: mixedMemberFeeRows,
    selectedIds: ['u-3', 'u-5'],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('checkbox', { name: 'Selecionar Luquinhas' })).toBeChecked()
    await expect(canvas.getByRole('checkbox', { name: 'Selecionar Ju' })).toBeChecked()
    await expect(canvas.getByRole('checkbox', { name: 'Selecionar Bia' })).not.toBeChecked()
    await expect(canvas.getByRole('checkbox', { name: 'Selecionar pendentes' })).not.toBeChecked()
  },
}

export const Empty: Story = {
  args: {
    rows: [],
    selectedIds: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Once for the table, once for the stacked list — CSS hides one of the two,
    // so each layout carries its own empty state.
    await expect(canvas.getAllByText('Nenhum membro encontrado.')).toHaveLength(2)
    await expect(canvas.getByText('0%')).toBeVisible()
  },
}

/**
 * Below `md` (768px) the table is replaced by stacked rows, matching the
 * breakpoint `FeeByTeamCard` uses. Each row keeps its selection control, badges,
 * phone, status and action.
 */
export const MobileList: Story = {
  args: {
    rows: mixedMemberFeeRows,
    selectedIds: ['u-3'],
  },
  globals: {
    viewport: { value: 'mobile1', isRotated: false },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Queried with `hidden` so the assertion holds at whatever width the runner
    // uses: the stacked markup is rendered for every member either way.
    const items = canvas.getAllByRole('listitem', { hidden: true })

    await expect(items).toHaveLength(8)
    await expect(items[0]).toHaveTextContent('Mari')
    await expect(items[0]).toHaveTextContent('Maria Silva')
    await expect(items[0]).toHaveTextContent('Coordenador')
    await expect(items[0]).toHaveTextContent('Pago')
    await expect(items[2]).toHaveTextContent('(11) 91000-4002')
    await expect(items[2]).toHaveTextContent('Pendente')
  },
}

function InteractiveExample(props: { rows: TeamMemberFeeRow[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  return (
    <TeamMembersFeeCard
      rows={props.rows}
      selectedIds={selectedIds}
      onToggleMember={(memberId) => setSelectedIds(toggleMemberSelection(selectedIds, memberId))}
      onToggleSelectAllPending={() =>
        setSelectedIds(toggleSelectAllPending(props.rows, selectedIds))
      }
      onConfirmMember={fn()}
    />
  )
}

/**
 * Demonstrates the wiring the page will own: local state plus the pure helpers
 * from `feeMemberSelection.ts`. Doubles as the worked example for integration.
 */
export const Interactive: Story = {
  args: {
    rows: mixedMemberFeeRows,
    selectedIds: [],
  },
  render: () => <InteractiveExample rows={mixedMemberFeeRows} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const selectAll = canvas.getByRole('checkbox', { name: 'Selecionar pendentes' })

    await userEvent.click(canvas.getByRole('checkbox', { name: 'Selecionar Bia' }))
    await expect(canvas.getByRole('checkbox', { name: 'Selecionar Bia' })).toBeChecked()
    // One of three pending members is not "all of them".
    await expect(selectAll).not.toBeChecked()

    await userEvent.click(selectAll)
    await expect(canvas.getByRole('checkbox', { name: 'Selecionar Luquinhas' })).toBeChecked()
    await expect(canvas.getByRole('checkbox', { name: 'Selecionar Ju' })).toBeChecked()
    await expect(selectAll).toBeChecked()

    await userEvent.click(selectAll)
    await expect(canvas.getByRole('checkbox', { name: 'Selecionar Luquinhas' })).not.toBeChecked()
    await expect(selectAll).not.toBeChecked()
  },
}
