import type { Meta, StoryObj } from '@storybook/react-vite'
import { Input } from './Input'

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
} satisfies Meta<typeof Input>

export const Primary = {
  args: {
    label: 'Nome completo',
    placeholder: 'Digite aqui...',
  },
} satisfies StoryObj

export const RequiredInput = {
  args: {
    label: 'Email',
    placeholder: 'email@exemplo.com',
    isRequired: true,
  },
} satisfies StoryObj

export const InvalidInput = {
  args: {
    label: 'Email',
    value: 'email.com',
    error: 'Esse email é inválido',
  },
} satisfies StoryObj

export default meta
