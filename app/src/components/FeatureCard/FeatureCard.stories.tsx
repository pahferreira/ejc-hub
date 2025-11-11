import type { Meta, StoryObj } from '@storybook/react-vite'
import { FeatureCard } from './FeatureCard'
import { FiZap, FiShield, FiTrendingUp } from 'react-icons/fi'

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
    title: 'Lightning Fast',
    description:
      'Experience blazing fast performance with our optimized infrastructure and cutting-edge technology stack.',
    icon: <FiZap size="20px" />,
  },
} satisfies StoryObj<typeof FeatureCard>

export const Secure = {
  args: {
    title: 'Enterprise-grade Security',
    description: 'Built-in best practices and ongoing monitoring keep your data safe.',
    icon: <FiShield size="20px" />,
  },
} satisfies StoryObj<typeof FeatureCard>

export const Growth = {
  args: {
    title: 'Built for Growth',
    description:
      'Scale confidently with resilient architecture and excellent developer ergonomics.',
    icon: <FiTrendingUp size="20px" />,
  },
} satisfies StoryObj<typeof FeatureCard>
