import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { FiChevronRight } from 'react-icons/fi'

export type ActionCardProps = {
  icon: ReactNode
  title: string
  description: string
  to?: string
  onClick?: () => void
}

export function ActionCard(props: ActionCardProps) {
  const content = (
    <div className="flex items-center gap-4 w-full">
      <figure className="p-3 rounded-lg bg-blue-100 shrink-0">
        <div className="text-blue-600" aria-hidden>
          {props.icon}
        </div>
      </figure>
      <div className="flex flex-col flex-1 min-w-0">
        <h3 className="m-0 text-base font-semibold text-gray-900 truncate">{props.title}</h3>
        <p className="m-0 text-sm text-gray-600 line-clamp-2">{props.description}</p>
      </div>
      <FiChevronRight className="text-gray-400 shrink-0" size={20} aria-hidden />
    </div>
  )

  const baseClasses =
    'block w-full bg-white px-4 py-4 shadow rounded-lg hover:shadow-md hover:bg-gray-50 transition-all cursor-pointer text-left'

  if (props.to) {
    return (
      <Link to={props.to} className={`${baseClasses} no-underline`}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" onClick={props.onClick} className={`${baseClasses} border-0`}>
      {content}
    </button>
  )
}
