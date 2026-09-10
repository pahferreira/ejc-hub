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
    onConfirmMember: fn(),
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

    // Only the three pending members offer an action or a checkbox; paid rows
    // expose a static marker instead.
    await expect(canvas.getAllByRole('button', { name: /^Confirmar taxa de/ })).toHaveLength(3)
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
    await expect(
      canvas.queryByRole('button', { name: /^Confirmar taxa de/ })
    ).not.toBeInTheDocument()
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
      onConfirmMember={fn()}
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
