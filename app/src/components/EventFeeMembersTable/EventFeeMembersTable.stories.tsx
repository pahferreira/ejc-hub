import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { EventFeeMembersTable } from './EventFeeMembersTable'
import {
  buildEventFeeMemberRow,
  mixedEventFeeMemberRows,
} from '../TeamMembersFeeCard/feeMemberMocks'
import { toggleMemberSelection } from '../TeamMembersFeeCard/feeMemberSelection'

const meta = {
  title: 'Financial/EventFeeMembersTable',
  component: EventFeeMembersTable,
  parameters: {
    layout: 'padded',
  },
  args: {
    onToggleMember: fn(),
    onReviewMember: fn(),
    canConfirm: true,
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EventFeeMembersTable>

export default meta
type Story = StoryObj<typeof meta>

/** The default admin view: 5 paid, 3 pending, spread over three teams. */
export const Default: Story = {
  args: {
    rows: mixedEventFeeMemberRows,
    selectedIds: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getAllByText('Acolhida').length).toBeGreaterThan(0)
    await expect(canvas.getAllByText('Cozinha').length).toBeGreaterThan(0)

    // Every row can be reviewed — correcting a confirmation and comping someone
    // both start from a settled row — but only the three unsettled members can
    // be checked, since the bulk action is confirm-as-paid.
    await expect(canvas.getAllByRole('button', { name: /^Revisar taxa de/ })).toHaveLength(8)
    await expect(canvas.getAllByRole('checkbox')).toHaveLength(3)
  },
}

/**
 * A read-only viewer (`financials-event-fee:read` without `:update`) sees
 * neither the selection column nor the row actions — not disabled ones, none.
 */
export const ReadOnly: Story = {
  args: {
    rows: mixedEventFeeMemberRows,
    selectedIds: [],
    canConfirm: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryAllByRole('checkbox')).toHaveLength(0)
    // Queried with `hidden` so the stacked mobile list counts too: it is in the
    // DOM at every width, and an action leaking into it would be invisible here
    // but live on a phone.
    await expect(
      canvas.queryAllByRole('button', { name: /^Revisar taxa de/, hidden: true })
    ).toHaveLength(0)
    await expect(canvas.queryByText('Ação')).not.toBeInTheDocument()
    // The informational columns are all still there.
    await expect(canvas.getByText('Status')).toBeVisible()
    await expect(canvas.getByText('Equipe')).toBeVisible()
  },
}

/** Selected pending rows are highlighted and checked. */
export const WithSelection: Story = {
  args: {
    rows: mixedEventFeeMemberRows,
    selectedIds: ['u-3', 'u-5'],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('checkbox', { name: 'Selecionar Luquinhas' })).toBeChecked()
    await expect(canvas.getByRole('checkbox', { name: 'Selecionar Ju' })).toBeChecked()
    await expect(canvas.getByRole('checkbox', { name: 'Selecionar Bia' })).not.toBeChecked()
  },
}

/** A member with no phone on file keeps the column's rhythm with an em dash. */
export const MissingPhone: Story = {
  args: {
    rows: [
      buildEventFeeMemberRow({
        userId: 'u-1',
        name: 'Pedro Henrique',
        nickname: 'Pedrão',
        phone: null,
      }),
    ],
    selectedIds: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getAllByText('—').length).toBeGreaterThan(0)
  },
}

/**
 * The status column spells out the stored status, so a comped member reads
 * "Isento" rather than folding into "Pago" the way the filters and stat cards
 * still do. That gap is deliberate and handled in the page's filter labels
 * ("Pagos e isentos"), which name both halves of the fold they apply.
 */
export const SettledMembers: Story = {
  args: {
    rows: [
      buildEventFeeMemberRow({
        userId: 'u-1',
        name: 'Maria Silva',
        nickname: 'Mari',
        status: 'paid',
        paymentStatus: 'exempt',
      }),
      buildEventFeeMemberRow({
        userId: 'u-2',
        name: 'João Santos',
        nickname: 'Joca',
        status: 'paid',
        paymentStatus: 'paid',
      }),
    ],
    selectedIds: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Both settle the fee, but only one of them involved any money. Two of each:
    // the stacked and table layouts both render, as the empty state asserts too.
    await expect(canvas.getAllByText('Isento')).toHaveLength(2)
    await expect(canvas.getAllByText('Pago')).toHaveLength(2)
    // Both rows are reviewable even though neither owes anything.
    await expect(canvas.getAllByRole('button', { name: /^Revisar taxa de/ })).toHaveLength(2)
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
  },
}

/**
 * Below `md` (768px) the table is replaced by stacked rows, matching the
 * breakpoint the sibling fee cards use. Each row keeps its team, phone, status
 * and action.
 */
export const MobileList: Story = {
  args: {
    rows: mixedEventFeeMemberRows,
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
    await expect(items[0]).toHaveTextContent('Acolhida')
    await expect(items[1]).toHaveTextContent('Cozinha')
  },
}

function InteractiveExample() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  return (
    <EventFeeMembersTable
      rows={mixedEventFeeMemberRows}
      selectedIds={selectedIds}
      canConfirm
      onToggleMember={(memberId) => setSelectedIds(toggleMemberSelection(selectedIds, memberId))}
      onReviewMember={fn()}
    />
  )
}

/**
 * The wiring the page owns: local state plus the pure helpers from
 * `feeMemberSelection.ts`, shared with the coordinator's card.
 */
export const Interactive: Story = {
  args: {
    rows: mixedEventFeeMemberRows,
    selectedIds: [],
  },
  render: () => <InteractiveExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('checkbox', { name: 'Selecionar Bia' }))
    await expect(canvas.getByRole('checkbox', { name: 'Selecionar Bia' })).toBeChecked()

    await userEvent.click(canvas.getByRole('checkbox', { name: 'Selecionar Bia' }))
    await expect(canvas.getByRole('checkbox', { name: 'Selecionar Bia' })).not.toBeChecked()
  },
}
