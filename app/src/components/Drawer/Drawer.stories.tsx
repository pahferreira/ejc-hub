import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Drawer } from './Drawer'
import { MultiSelector, type Option } from '../MultiSelector/MultiSelector'

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

const teamOptions: Option[] = [
  { label: 'Liturgia', value: 'liturgia' },
  { label: 'Louvor', value: 'louvor' },
  { label: 'Vigília', value: 'vigilia' },
  { label: 'Cozinha', value: 'cozinha' },
  { label: 'Secretaria', value: 'secretaria' },
]

const MultiSelectorAtBottom = () => {
  const [selected, setSelected] = useState<Option[]>([])

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col justify-end">
      <MultiSelector
        options={teamOptions}
        selected={selected}
        onChange={setSelected}
        placeholder="Todas as equipes"
      />
    </div>
  )
}

// The body is a scroll container (`overflow-y-auto`): a list opened at its
// bottom has to escape it, stay above the dialog and not count as an outside
// click (#371).
export const WithMultiSelectorAtBottom: Story = {
  render: (args) => (
    <DrawerWrapper {...args}>
      <MultiSelectorAtBottom />
    </DrawerWrapper>
  ),
  args: {
    open: false,
    onClose: () => {},
    title: 'ADICIONAR MEMBROS',
    children: null,
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)
    await userEvent.click(screen.getByRole('button', { name: 'Open Drawer' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Todas as equipes' }))

    const listbox = await screen.findByRole('listbox')
    const rect = listbox.getBoundingClientRect()
    const center = canvasElement.ownerDocument.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    )
    await expect(listbox.contains(center)).toBe(true)

    await userEvent.click(within(listbox).getByRole('option', { name: 'Liturgia' }))
    await expect(screen.getByRole('dialog')).toBeInTheDocument()
    await expect(screen.getByRole('button', { name: 'Liturgia' })).toBeInTheDocument()
  },
}
