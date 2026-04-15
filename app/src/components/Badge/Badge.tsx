import type { ReactNode } from 'react'

type BadgeVariant = 'pending' | 'received' | 'completed' | 'waiting_list' | 'default'

type BadgeProps = {
  children: ReactNode
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  pending: 'border-red bg-red/10 text-red',
  received: 'border-blue bg-blue/10 text-blue',
  completed: 'border-green bg-green/10 text-green',
  waiting_list: 'border-orange bg-orange/10 text-orange',
  default: 'border-black bg-white text-black',
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-sm font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  )
}
