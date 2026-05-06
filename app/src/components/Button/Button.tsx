import clsx from 'clsx'
import type { ReactNode } from 'react'

type ButtonProps = {
  children: ReactNode
  disabled?: boolean
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}

const foregroundVariant = {
  primary: 'bg-primary text-white',
  secondary: 'bg-secondary text-dark-brown',
}

export function Button(props: ButtonProps) {
  const variant = props.variant || 'primary'

  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled}
      className={clsx(
        foregroundVariant[variant],
        'px-3 py-1.5 text-xs font-medium gap-2 border-2 border-dark-brown rounded-lg button-shadow hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'
      )}
    >
      {props.children}
    </button>
  )
}
