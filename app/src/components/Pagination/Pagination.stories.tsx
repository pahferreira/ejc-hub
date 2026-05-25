import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Pagination } from './Pagination'

const meta = {
  title: 'UI/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Pagination>

export const Default = {
  args: {
    page: 1,
    pageSize: 25,
    total: 329,
    onPrev: fn(),
    onNext: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const next = canvas.getByLabelText('Next page')
    await userEvent.click(next)
    expect(args.onNext).toHaveBeenCalled()
  },
} satisfies StoryObj<typeof Pagination>

export const MiddlePage = {
  args: {
    page: 3,
    pageSize: 25,
    total: 329,
    onPrev: fn(),
    onNext: fn(),
  },
} satisfies StoryObj<typeof Pagination>

export const LastPage = {
  args: {
    page: 14,
    pageSize: 25,
    total: 329,
    onPrev: fn(),
    onNext: fn(),
  },
} satisfies StoryObj<typeof Pagination>

export const Empty = {
  args: {
    page: 1,
    pageSize: 25,
    total: 0,
    onPrev: fn(),
    onNext: fn(),
  },
} satisfies StoryObj<typeof Pagination>

export default meta
