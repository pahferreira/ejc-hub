import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { DisputedBadge } from './DisputedBadge'

const meta = {
  title: 'MemberRequests/DisputedBadge',
  component: DisputedBadge,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof DisputedBadge>

export default meta

type Story = StoryObj<typeof meta>

/** Singular: one other team is asking. */
export const OneOtherTeam: Story = {
  args: { otherPendingCount: 1 },
}

export const SeveralOtherTeams: Story = {
  args: { otherPendingCount: 3 },
}

/**
 * Uncontested requests render nothing, so callers can place the badge
 * unconditionally without a guard of their own.
 */
export const Uncontested: Story = {
  args: { otherPendingCount: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    expect(canvas.queryByText(/equipe/)).toBeNull()
  },
}
