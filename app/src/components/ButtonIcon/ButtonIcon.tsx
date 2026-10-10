import clsx from 'clsx'
import type { ReactNode } from 'react'

type ButtonIconProps = {
  icon: ReactNode
  onClick?: () => void
  disabled?: boolean
  ariaLabel: string
  variant?: 'primary' | 'secondary' | 'success'
}

const variantClasses = {
  primary: 'bg-primary text-white',
  secondary: 'bg-secondary text-dark-brown',
  // The affirmative action in a pair of opposed ones — approve beside deny on
  // the member-requests queue. Green rather than the brown `primary` so the
  // two read as a choice at a glance instead of as "the button" and "the
  // other button".
  success: 'bg-green text-white',
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
