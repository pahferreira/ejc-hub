import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { MeetingAttendeeRow } from './MeetingAttendeeRow'

const meta = {
  title: 'UI/MeetingAttendeeRow',
  component: MeetingAttendeeRow,
  parameters: {
    layout: 'padded',
  },
  args: {
    userId: 'u1',
    name: 'João da Silva',
    nickname: 'Jota',
    pictureUrl: null,
    status: 'absent',
    reason: '',
    onPresentChange: fn(),
    onJustify: fn(),
    onClearJustification: fn(),
    onReasonChange: fn(),
  },
} satisfies Meta<typeof MeetingAttendeeRow>

export default meta
type Story = StoryObj<typeof meta>

export const Unticked: Story = {}

export const Present: Story = {
  args: { status: 'present' },
}

export const Coordinator: Story = {
  args: { status: 'present', isCoordinator: true },
}

export const Justified: Story = {
  args: { status: 'justified', reason: 'Plantão no trabalho' },
}

export const JustifiedMissingReason: Story = {
  args: { status: 'justified', reasonError: 'Informe a justificativa.' },
}
