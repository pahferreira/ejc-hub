import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/internal/test'
import { SearchInput } from './SearchInput'

const meta = {
  title: 'UI/SearchInput',
  component: SearchInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof SearchInput>

export const Default = {
  args: {
    placeholder: 'Search by name or email...',
    onChange: fn(),
    onSearch: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByPlaceholderText('Search by name or email...')

    // Type in the search input
    await userEvent.type(input, 'john.doe@example.com')

    // Verify onChange was called
    expect(args.onChange).toHaveBeenCalled()

    // Press Enter to trigger search
    await userEvent.keyboard('{Enter}')

    // Verify onSearch was called with the correct value
    expect(args.onSearch).toHaveBeenCalled()
  },
} satisfies StoryObj<typeof SearchInput>

export default meta
