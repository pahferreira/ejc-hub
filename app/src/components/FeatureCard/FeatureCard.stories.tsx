import type { Meta, StoryObj } from '@storybook/react-vite'
import { FeatureCard } from './FeatureCard'
import {
  FiClipboard,
  FiUsers,
  FiSettings,
  FiShoppingBag,
  FiStar,
  FiMessageCircle,
} from 'react-icons/fi'

const meta = {
  title: 'UI/FeatureCard',
  component: FeatureCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof FeatureCard>

export default meta

export const Default = {
  args: {
    title: 'Inscrições',
    description: 'Coleta de dados, habilidades e preferências de equipe',
    icon: <FiClipboard size="20px" />,
    number: 1,
  },
} satisfies StoryObj<typeof FeatureCard>

export const WithoutNumber = {
  args: {
    title: 'Montagem de Equipes',
    description: 'Formação das equipes respeitando prioridades e capacidades',
    icon: <FiUsers size="20px" />,
  },
} satisfies StoryObj<typeof FeatureCard>

export const Preparation = {
  args: {
    title: 'Preparação',
    description: 'Reuniões, controle de presença e financeiro',
    icon: <FiSettings size="20px" />,
    number: 3,
  },
} satisfies StoryObj<typeof FeatureCard>

export const Uniform = {
  args: {
    title: 'Uniforme',
    description: 'Pedido e controle de pagamento das camisetas',
    icon: <FiShoppingBag size="20px" />,
    number: 4,
  },
} satisfies StoryObj<typeof FeatureCard>

export const EventDay = {
  args: {
    title: 'O Grande Dia!',
    description: 'Execução do evento com cronograma em tempo real',
    icon: <FiStar size="20px" />,
    number: 5,
  },
} satisfies StoryObj<typeof FeatureCard>

export const Feedback = {
  args: {
    title: 'Feedback',
    description: 'Avaliação de líderes e membros para melhoria contínua',
    icon: <FiMessageCircle size="20px" />,
    number: 6,
  },
} satisfies StoryObj<typeof FeatureCard>
