import clsx from 'clsx'
import type { ReactNode } from 'react'

type ButtonProps = {
  children: ReactNode
  disabled?: boolean
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'destructive'
  ariaLabel?: string
  size?: 'regular' | 'small'
}

const foregroundVariant = {
  primary: 'bg-primary text-white',
  secondary: 'bg-secondary/60 text-dark-brown',
  destructive: 'bg-destructive text-white',
}

export function Button(props: ButtonProps) {
  const variant = props.variant || 'primary'
  const size = props.size || 'regular'

  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled}
      aria-label={props.ariaLabel}
      className={clsx(
        foregroundVariant[variant],
        'min-w-fit button-shadow gap-2 border-2 border-dark-brown rounded-lg hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
        size === 'small' ? 'px-1.5 py-0.5 text-xs' : 'px-3 py-1.5 text-sm'
      )}
    >
      {props.children}
    </button>
  )
}
