import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { RequestReason } from './RequestReason'

const meta = {
  title: 'MemberRequests/RequestReason',
  component: RequestReason,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof RequestReason>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { text: 'Precisamos de alguém com experiência em canto.' },
}

/** Line breaks the coordinator typed are kept. */
export const Multiline: Story = {
  args: {
    text: 'Precisamos de alguém com experiência em canto.\nTambém toca violão.\n\nObrigado!',
  },
}

/** Unbroken text wraps instead of stretching the panel. */
export const LongUnbrokenText: Story = {
  args: { text: 'a'.repeat(400) },
}

/** Null or blank: the fallback copy shows. */
export const Empty: Story = {
  args: { text: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    expect(canvas.getByText('Nenhum motivo informado.')).toBeInTheDocument()
  },
}
