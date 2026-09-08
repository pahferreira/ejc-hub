import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { FeeBulkSelectionBar } from './FeeBulkSelectionBar'

const meta = {
  title: 'Financial/FeeBulkSelectionBar',
  component: FeeBulkSelectionBar,
  parameters: {
    // Fullscreen so the viewport-fixed bar sits where it really would.
    layout: 'fullscreen',
  },
  args: {
    onCancel: fn(),
    onConfirm: fn(),
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FeeBulkSelectionBar>

export default meta
type Story = StoryObj<typeof meta>

/** Nothing selected: the bar owns its visibility and renders nothing at all. */
export const Hidden: Story = {
  args: {
    selectedCount: 0,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('status')).not.toBeInTheDocument()
  },
}

/** The singular case, which a plain `${n} membros` template gets wrong. */
export const OneSelected: Story = {
  args: {
    selectedCount: 1,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('membro selecionado')).toBeVisible()
    await expect(canvas.getByRole('button', { name: /Confirmar 1 taxa$/ })).toBeVisible()
  },
}

export const TwoSelected: Story = {
  args: {
    selectedCount: 2,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('status')).toBeVisible()
    await expect(canvas.getByText('2')).toBeVisible()
    await expect(canvas.getByText('membros selecionados')).toBeVisible()
    await expect(canvas.getByRole('button', { name: /Confirmar 2 taxas/ })).toBeVisible()
  },
}

/** A whole team selected at once — checks the pill and button hold their shape. */
export const ManySelected: Story = {
  args: {
    selectedCount: 12,
  },
}

function InteractiveExample() {
  const [selectedCount, setSelectedCount] = useState(3)

  return (
    <div className="min-h-64 p-6">
      <button
        type="button"
        onClick={() => setSelectedCount(selectedCount + 1)}
        className="cursor-pointer rounded-lg border border-dark-brown px-3 py-1.5 text-sm"
      >
        Selecionar mais um
      </button>
      <FeeBulkSelectionBar
        selectedCount={selectedCount}
        onCancel={() => setSelectedCount(0)}
        onConfirm={fn()}
      />
    </div>
  )
}

/** Cancelling clears the selection, which makes the bar disappear on its own. */
export const Interactive: Story = {
  args: {
    selectedCount: 3,
  },
  render: () => <InteractiveExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('button', { name: /Confirmar 3 taxas/ })).toBeVisible()

    await userEvent.click(canvas.getByRole('button', { name: 'Selecionar mais um' }))
    await expect(canvas.getByRole('button', { name: /Confirmar 4 taxas/ })).toBeVisible()

    await userEvent.click(canvas.getByRole('button', { name: 'Cancelar' }))

    // The bar animates out before unmounting, so it lingers past the click.
    await waitFor(() => expect(canvas.queryByRole('status')).not.toBeInTheDocument())
  },
}

/**
 * The bar transitions in and out rather than popping, so it stays mounted for
 * the duration of the leave animation. It must keep showing the count it had
 * while it fades, not the 0 that triggered the exit.
 */
export const TogglesWithoutFlashingZero: Story = {
  args: {
    selectedCount: 3,
  },
  render: () => <InteractiveExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'Cancelar' }))

    // Still on screen mid-exit: the label holds at 3 instead of flashing "0".
    await expect(canvas.getByText('membros selecionados')).toBeInTheDocument()
    await expect(canvas.queryByText('0 membros selecionados')).not.toBeInTheDocument()

    await waitFor(() => expect(canvas.queryByRole('status')).not.toBeInTheDocument())

    // And it comes back cleanly on the next selection. `toBeVisible` counts
    // `opacity: 0` as invisible, so this only holds once the enter finishes.
    await userEvent.click(canvas.getByRole('button', { name: 'Selecionar mais um' }))
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: /Confirmar 1 taxa$/ })).toBeVisible()
    )
  },
}
