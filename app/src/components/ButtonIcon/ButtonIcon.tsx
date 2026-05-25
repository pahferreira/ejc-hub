import clsx from 'clsx'
import type { ReactNode } from 'react'

type ButtonIconProps = {
  icon: ReactNode
  onClick?: () => void
  disabled?: boolean
  ariaLabel: string
  variant?: 'primary' | 'secondary'
}

const variantClasses = {
  primary: 'bg-primary text-white',
  secondary: 'bg-secondary text-dark-brown',
}

export function ButtonIcon(props: ButtonIconProps) {
  const variant = props.variant || 'primary'

  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      aria-label={props.ariaLabel}
      className={clsx(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-dark-brown button-shadow',
        'hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
        props.disabled ? 'bg-white text-dark-brown' : variantClasses[variant]
      )}
    >
      {props.icon}
    </button>
  )
}
