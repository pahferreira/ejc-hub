import type { Meta, StoryObj } from '@storybook/react-vite'
import { Card } from './Card'

const meta = {
  title: 'UI/Card',
  tags: ['autodocs'],
  component: Card,
} satisfies Meta<typeof Card>

export const Primary = {
  args: {
    children: (
      <div>
        <h1 className="text-lg font-semibold mb-2">Card Example</h1>
        <p className="text-md">Here is a card example with some content on it.</p>
        <div className="flex gap-2 mt-4">
          <button className="px-4 py-2 border border-red-500 text-red-500 rounded">Delete</button>
          <button className="px-4 py-2 border border-blue-500 text-blue-500 rounded">Cancel</button>
          <button className="px-4 py-2 border bg-blue-500 text-white rounded">Confirm</button>
        </div>
      </div>
    ),
  },
} satisfies StoryObj

export default meta
