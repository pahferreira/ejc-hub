import type { ReactNode } from 'react'

export type BadgeVariant = 'default' | 'warning' | 'error' | 'success' | 'info'

type BadgeProps = {
  children: ReactNode
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'border-dark-brown bg-dark-brown/10 text-dark-brown',
  warning: 'border-orange bg-orange/10 text-orange',
  error: 'border-red bg-red/10 text-red',
  success: 'border-green bg-green/10 text-green',
  info: 'border-blue bg-blue/10 text-blue',
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  )
}
