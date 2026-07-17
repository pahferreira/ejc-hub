/* eslint-disable storybook/use-storybook-expect */
import { describe, it, expect } from 'vitest'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { TeamAvatar } from './TeamAvatar'
import { getInitials } from './getInitials'

const meta = {
  title: 'UI/TeamAvatar',
  component: TeamAvatar,
  tags: ['autodocs'],
} satisfies Meta<typeof TeamAvatar>

export default meta

export const SingleWord: StoryObj<typeof TeamAvatar> = {
  args: {
    name: 'Música',
  },
}

export const TwoWords: StoryObj<typeof TeamAvatar> = {
  args: {
    name: 'Coordenação Geral',
  },
}

export const LongName: StoryObj<typeof TeamAvatar> = {
  args: {
    name: 'Equipe de Liturgia e Acolhida',
  },
}

describe('getInitials', () => {
  it('returns the first two letters for a single-word name', () => {
    expect(getInitials('Som')).toBe('SO')
  })

  it('returns the first letter of each of the first two words for a two-word name', () => {
    expect(getInitials('Coordenação Geral')).toBe('CG')
  })

  it('skips Portuguese connector words when deriving initials', () => {
    expect(getInitials('Som e Iluminação')).toBe('SI')
  })

  it('uses only the first two meaningful words when there are more than two', () => {
    expect(getInitials('Equipe de Liturgia e Acolhida')).toBe('EL')
  })

  it('is case-insensitive when matching connector words', () => {
    expect(getInitials('Som E Iluminação')).toBe('SI')
  })

  it('handles extra whitespace between words', () => {
    expect(getInitials('  Som   e   Iluminação  ')).toBe('SI')
  })

  it('falls back to the raw words when the name is only connector words', () => {
    expect(getInitials('de')).toBe('DE')
  })

  it('uppercases the resulting initials', () => {
    expect(getInitials('música')).toBe('MÚ')
  })
})
