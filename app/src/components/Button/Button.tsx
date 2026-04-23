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
  secondary: 'bg-secondary text-black',
}

export function Button(props: ButtonProps) {
  const variant = props.variant || 'primary'
  return (
    <div className="relative w-fit pb-1">
      <div className="absolute inset-0 rounded-lg bg-dark-brown" />
      <button
        onClick={props.onClick}
        disabled={props.disabled}
        className={clsx(
          'relative w-fit cursor-pointer rounded-lg border border-dark-brown py-2 px-4 text-center font-bold hover:-translate-y-1 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50',
          foregroundVariant[variant]
        )}
      >
        {props.children}
      </button>
    </div>
  )
}
