import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent, waitFor, within } from 'storybook/test'
import { TruncatedPillList } from './TruncatedPillList'

// The component is generic; the args-driven stories below all use strings, the
// default case. `WithRenderItem` renders its own object items.
const StringPillList = TruncatedPillList<string>

const meta = {
  title: 'UI/TruncatedPillList',
  component: StringPillList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StringPillList>

export default meta
type Story = StoryObj<typeof meta>

const SKILLS = [
  'Toca algum outro instrumento',
  'Toca violão',
  'Toca percussão',
  'Canta',
  'Atuação',
  'Dança',
  'Habilidades Culinárias',
  'Papelaria e Confecção Manual',
  'Edição de Vídeo e Mídias',
]

/** Three skills sit inline with nothing folded away. */
export const NoOverflow: Story = {
  args: {
    items: SKILLS.slice(0, 3),
    itemNoun: 'habilidades',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
  },
}

/** Exactly `maxVisible` items is the boundary: still no "+N" trigger. */
export const ExactlyAtLimit: Story = {
  args: {
    items: SKILLS.slice(0, 4),
    itemNoun: 'habilidades',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Canta')).toBeVisible()
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
  },
}

/**
 * Nine skills: four inline, five behind the trigger. The panel is portalled out
 * of the canvas by `anchor`, so it is asserted against `screen`, not `canvas`.
 */
export const WithOverflow: Story = {
  args: {
    items: SKILLS,
    itemNoun: 'habilidades',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByText('Dança')).not.toBeInTheDocument()

    const trigger = canvas.getByRole('button', { name: 'mais 5 habilidades' })
    await expect(trigger).toHaveTextContent('+5')

    await userEvent.click(trigger)

    // `waitFor`, not a bare `findByText`: the panel opens through an opacity
    // transition, and `toBeVisible` reads a mid-flight `opacity: 0` on the
    // ancestor panel as invisible. `findByText` only waits for presence.
    await waitFor(() => expect(screen.getByText('Dança')).toBeVisible())
    await expect(screen.getByText('Edição de Vídeo e Mídias')).toBeVisible()
  },
}

/** The trigger is reachable and operable from the keyboard alone. */
export const OpensWithKeyboard: Story = {
  args: {
    items: SKILLS,
    itemNoun: 'habilidades',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'mais 5 habilidades' })).toHaveFocus()

    await userEvent.keyboard('{Enter}')

    await waitFor(() => expect(screen.getByText('Dança')).toBeVisible())
  },
}

/** `maxVisible` is configurable; two inline leaves "+7". */
export const CustomMaxVisible: Story = {
  args: {
    items: SKILLS,
    maxVisible: 2,
    itemNoun: 'habilidades',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('button', { name: 'mais 7 habilidades' })).toBeVisible()
  },
}

const TEAMS = [
  { id: 't1', name: 'Acolhida', color: '#e11d48' },
  { id: 't2', name: 'Liturgia', color: '#7c3aed' },
  { id: 't3', name: 'Música', color: '#0284c7' },
  { id: 't4', name: 'Cozinha', color: '#d97706' },
  { id: 't5', name: 'Ordem', color: '#059669' },
  { id: 't6', name: 'Lanche', color: '#ea580c' },
]

/**
 * Object items drawn through `renderItem` (a colored dot beside the name) and
 * keyed through `getItemKey`. The hidden ones render the same way in the
 * popover.
 */
export const WithRenderItem: StoryObj = {
  render: () => (
    <TruncatedPillList
      items={TEAMS}
      itemNoun="equipes"
      getItemKey={(team) => team.id}
      renderItem={(team) => (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-tertiary px-2.5 py-0.5 text-xs font-medium text-dark-brown">
          <span
            aria-hidden
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: team.color }}
          />
          {team.name}
        </span>
      )}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Cozinha')).toBeVisible()
    await expect(canvas.queryByText('Ordem')).not.toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: 'mais 2 equipes' }))

    await waitFor(() => expect(screen.getByText('Ordem')).toBeVisible())
    await expect(screen.getByText('Lanche')).toBeVisible()
  },
}

/** Nobody filled the form in — an em dash rather than an empty row. */
export const Empty: Story = {
  args: {
    items: [],
    itemNoun: 'habilidades',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('—')).toBeVisible()
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
  },
}
