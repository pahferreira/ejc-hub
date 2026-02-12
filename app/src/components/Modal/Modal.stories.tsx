import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Modal } from './Modal'

const meta = {
  title: 'UI/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

const ModalWrapper = (args: any) => {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-blue-500 px-4 py-2 text-white text-sm font-medium hover:bg-blue-600"
      >
        Open Modal
      </button>
      <Modal {...args} open={open} onClose={() => setOpen(false)}>
        {args.children}
      </Modal>
    </div>
  )
}

export const Default: Story = {
  render: (args) => (
    <ModalWrapper {...args}>
      <p className="text-gray-600">This is the modal content.</p>
    </ModalWrapper>
  ),
  args: {
    open: false,
    onClose: () => {},
    title: 'Modal Title',
    children: <p className="text-gray-600">This is the modal content.</p>,
  },
}
