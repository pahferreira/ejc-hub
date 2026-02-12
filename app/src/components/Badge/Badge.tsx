import type { ReactNode } from 'react'

type BadgeVariant = 'pending' | 'approved' | 'completed' | 'waiting_list' | 'default'

type BadgeProps = {
  children: ReactNode
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  waiting_list: 'bg-gray-100 text-gray-700',
  default: 'bg-gray-100 text-gray-700',
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  )
}
