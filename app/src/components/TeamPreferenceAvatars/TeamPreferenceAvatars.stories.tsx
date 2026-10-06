import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { TeamPreferenceAvatars } from './TeamPreferenceAvatars'

const meta = {
  title: 'MemberRequests/TeamPreferenceAvatars',
  component: TeamPreferenceAvatars,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TeamPreferenceAvatars>

export default meta
type Story = StoryObj<typeof meta>

export const OnePreference: Story = {
  args: {
    preferences: [{ teamInstanceId: 't-1', name: 'Liturgia' }],
  },
}

export const TwoPreferences: Story = {
  args: {
    preferences: [
      { teamInstanceId: 't-1', name: 'Liturgia' },
      { teamInstanceId: 't-2', name: 'Acolhida' },
    ],
  },
}

/** Exactly three fits without an overflow badge. */
export const ThreePreferences: Story = {
  args: {
    preferences: [
      { teamInstanceId: 't-1', name: 'Liturgia' },
      { teamInstanceId: 't-2', name: 'Acolhida' },
      { teamInstanceId: 't-3', name: 'Cozinha' },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByText(/^\+/)).not.toBeInTheDocument()
  },
}

/** A fourth preference is folded into a "+1" badge, capping the stack at three avatars. */
export const FourPreferences: Story = {
  args: {
    preferences: [
      { teamInstanceId: 't-1', name: 'Liturgia' },
      { teamInstanceId: 't-2', name: 'Acolhida' },
      { teamInstanceId: 't-3', name: 'Cozinha' },
      { teamInstanceId: 't-4', name: 'Som e Iluminação' },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('+1')).toBeVisible()
  },
}

/** Nobody put this team down — an em dash rather than an empty stack. */
export const NoPreferences: Story = {
  args: {
    preferences: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('—')).toBeVisible()
  },
}
