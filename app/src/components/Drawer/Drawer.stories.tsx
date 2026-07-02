import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Drawer } from './Drawer'

const meta = {
  title: 'UI/Drawer',
  component: Drawer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Drawer>

export default meta
type Story = StoryObj<typeof meta>

const DrawerWrapper = (args: React.ComponentProps<typeof Drawer>) => {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-primary px-4 py-2 text-white text-sm font-medium hover:bg-dark-brown transition-colors"
      >
        Open Drawer
      </button>
      <Drawer {...args} open={open} onClose={() => setOpen(false)}>
        {args.children}
      </Drawer>
    </div>
  )
}

export const Default: Story = {
  render: (args) => (
    <DrawerWrapper {...args}>
      <p className="text-gray-600">This is the drawer content.</p>
    </DrawerWrapper>
  ),
  args: {
    open: false,
    onClose: () => {},
    title: 'TÍTULO DO DRAWER',
    children: <p className="text-gray-600">This is the drawer content.</p>,
  },
}

export const WithSubtitle: Story = {
  render: (args) => (
    <DrawerWrapper {...args}>
      <p className="text-gray-600">Content with subtitle.</p>
    </DrawerWrapper>
  ),
  args: {
    open: false,
    onClose: () => {},
    title: 'DEFINIR COORDENAÇÃO — Liturgia',
    subtitle: 'Até 3 coordenadores por equipe',
    children: <p className="text-gray-600">Content with subtitle.</p>,
  },
}

export const WithFooter: Story = {
  render: (args) => (
    <DrawerWrapper {...args}>
      <p className="text-gray-600">Content with footer actions.</p>
    </DrawerWrapper>
  ),
  args: {
    open: false,
    onClose: () => {},
    title: 'DEFINIR COORDENAÇÃO — Louvor',
    subtitle: 'Até 3 coordenadores por equipe',
    footer: (
      <>
        <button className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-dark-brown hover:bg-gray-50">
          Cancelar
        </button>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-dark-brown">
          Salvar coordenação (2)
        </button>
      </>
    ),
    children: <p className="text-gray-600">Content with footer actions.</p>,
  },
}
