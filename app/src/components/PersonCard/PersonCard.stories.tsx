import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { PersonCard } from './PersonCard'
import { MemberFeeStatusPill } from '../TeamMembersFeeCard/MemberFeeStatusPill'
import { ExperienceBadge } from '../ExperienceBadge/ExperienceBadge'
import { PersonAttendanceBlock } from '../PersonAttendanceBlock/PersonAttendanceBlock'

const meta = {
  title: 'UI/PersonCard',
  component: PersonCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PersonCard>

export default meta
type Story = StoryObj<typeof meta>

export const Coordinator: Story = {
  args: {
    name: 'Julia Martins',
    nickname: 'Ju',
    role: 'Coordenador',
    phone: '(41) 90427-7888',
    weekAvailability: ['monday', 'wednesday', 'friday'],
    attributes: ['Música', 'Teatro'],
    showStatusChips: true,
    feeStatusChip: <MemberFeeStatusPill status="paid" />,
  },
}

export const Member: Story = {
  args: {
    name: 'Bruno Carvalho',
    nickname: 'Bru',
    phone: '(41) 91234-5678',
    weekAvailability: ['saturday', 'sunday'],
    attributes: ['Cozinha'],
    showStatusChips: true,
    feeStatusChip: <MemberFeeStatusPill status="pending" />,
    onRemove: fn(),
    removeAriaLabel: 'Remover Bruno Carvalho da equipe',
  },
}

export const WithAttendance: Story = {
  args: {
    name: 'Julia Martins',
    nickname: 'Ju',
    phone: '(41) 90427-7888',
    weekAvailability: ['monday', 'wednesday', 'friday'],
    showStatusChips: true,
    feeStatusChip: <MemberFeeStatusPill status="paid" />,
    attendance: (
      <PersonAttendanceBlock
        rate={{ present: 7, eligible: 8, justified: 2, percentage: 88, band: 'good' }}
        label="Presença de Ju"
      />
    ),
  },
}

export const Minimal: Story = {
  args: {
    name: 'Carla Souza',
    nickname: 'Carlinha',
  },
}

export const WithExperienceBadge: Story = {
  args: {
    name: 'Alice Ribeiro',
    nickname: 'Lili',
    badge: <ExperienceBadge experienceType="newbie" />,
    phone: '(41) 90427-7888',
    attributes: ['Música', 'Teatro'],
  },
}
