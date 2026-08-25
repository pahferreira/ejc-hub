import type { Meta, StoryObj } from '@storybook/react-vite'
import { CopyButton } from './CopyButton'

const meta = {
  title: 'UI/CopyButton',
  component: CopyButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CopyButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: '(11) 91000-4000',
    ariaLabel: 'Copiar telefone',
  },
}

export const InlineWithText: Story = {
  render: (args) => (
    <span className="flex items-center gap-1 text-xs text-secondary-foreground">
      (11) 91000-4000
      <CopyButton {...args} />
    </span>
  ),
  args: {
    value: '(11) 91000-4000',
    ariaLabel: 'Copiar telefone',
  },
}
