import type { Meta, StoryObj } from '@storybook/react-vite';

import { SectionTitle } from './SectionTitle';


const meta = {
  title: 'UI/SectionTitle',
  component: SectionTitle,

  tags: ['autodocs'],


 

} satisfies Meta<typeof SectionTitle>

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    title: 'Informações Pessoais',
    
  },
};

export const WithDescription: Story = {
  args: {
    title: 'Informações Pessoais',
    description: 'Insira suas informações pessoais abaixo.'
  },
};
