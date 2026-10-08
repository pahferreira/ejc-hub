import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent, waitFor, within } from 'storybook/test'
import { TruncatedPillList } from './TruncatedPillList'

const meta = {
  title: 'UI/TruncatedPillList',
  component: TruncatedPillList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TruncatedPillList>

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
