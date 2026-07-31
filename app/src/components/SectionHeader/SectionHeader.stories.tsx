import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { FiUsers } from 'react-icons/fi'
import { SectionHeader } from './SectionHeader'
import { Button } from '../Button/Button'

const meta = {
  title: 'UI/SectionHeader',
  component: SectionHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SectionHeader>

export default meta
type Story = StoryObj<typeof meta>

export const WithAction: Story = {
  args: {
    title: 'Membros da equipe',
    action: <Button onClick={fn()}>+ Adicionar</Button>,
  },
}

export const WithoutAction: Story = {
  args: {
    title: 'Membros da equipe',
  },
}

export const WithIcon: Story = {
  args: {
    icon: <FiUsers size={18} />,
    title: 'Membros da equipe',
  },
}
