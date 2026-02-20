import type { Meta, StoryObj } from '@storybook/react-vite'
import { TextArea } from './TextArea'

const meta = {
  title: 'UI/TextArea',
  component: TextArea,
  tags: ['autodocs'],
} satisfies Meta<typeof TextArea>

export const Primary = {
  args: {
    label: 'Descrição',
    placeholder: 'Digite aqui...',
  },
} satisfies StoryObj

export const Required = {
  args: {
    label: 'Experiência anterior',
    placeholder: 'Descreva sua experiência...',
    isRequired: true,
  },
} satisfies StoryObj

export const Invalid = {
  args: {
    label: 'Descrição',
    value: 'Texto inválido',
    error: 'Esse campo é obrigatório',
  },
} satisfies StoryObj

export default meta
