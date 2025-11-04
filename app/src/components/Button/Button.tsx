import type { ReactNode } from 'react'

type ButtonProps = {
  children: ReactNode
  disabled?: boolean
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'tertiary'
}

const colorVariant = {
  primary: 'bg-blue-500 text-white disabled:bg-blue-300',
  secondary: 'bg-black text-white disabled:bg-gray-400',
  tertiary:
    'bg-transparent text-gray-800 border border-gray-800 disabled:text-gray-400 disabled:border-gray-400',
}

export function Button(props: ButtonProps) {
  const buttonVariant = props.variant || 'primary'
  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled}
      className={`w-full p-4 cursor-pointer rounded-md text-center font-bold capitalize disabled:cursor-not-allowed ${colorVariant[buttonVariant]}`}
    >
      {props.children}
    </button>
  )
}
