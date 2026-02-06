import { FiCheckCircle, FiAlertCircle, FiInfo } from 'react-icons/fi'
import { Link } from 'react-router'

export type StatusCardProps = {
  title: string
  variant: 'success' | 'warning' | 'info' | 'neutral'
  description?: string
  action?: {
    label: string
    onClick?: () => void
    to?: string
  }
}

const variantConfig = {
  success: {
    status: 'bg-green-100 text-green-800',
    icon: { bg: 'bg-green-100', text: 'text-green-600', component: FiCheckCircle },
  },
  warning: {
    status: 'bg-yellow-100 text-yellow-800',
    icon: { bg: 'bg-blue-100', text: 'text-blue-600', component: FiAlertCircle },
  },
  info: {
    status: 'bg-blue-100 text-blue-800',
    icon: { bg: 'bg-blue-100', text: 'text-blue-600', component: FiInfo },
  },
  neutral: {
    status: 'bg-gray-100 text-gray-800',
    icon: null,
  },
}

export function StatusCard(props: StatusCardProps) {
  const config = variantConfig[props.variant]
  const IconComponent = config.icon?.component

  const actionClassName =
    'w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors cursor-pointer border-0 no-underline text-center'

  return (
    <div className="w-full bg-white px-6 py-5 shadow rounded-lg md:flex md:justify-between md:items-center">
      <div className="flex flex-col items-center md:flex-row gap-4">
        {IconComponent && config.icon && (
          <figure className={`p-3 rounded-lg ${config.icon.bg} shrink-0`}>
            <div className={config.icon.text} aria-hidden>
              <IconComponent size={24} />
            </div>
          </figure>
        )}
        <div className="flex flex-col flex-1 min-w-0">
          <h3 className="m-0 text-lg md:text-left font-semibold text-gray-900">{props.title}</h3>
          {props.description && <p className="m-0 text-sm text-gray-600">{props.description}</p>}
        </div>
      </div>
      {props.action && (
        <div className="mt-4">
          {props.action.to ? (
            <Link to={props.action.to} className={actionClassName}>
              {props.action.label}
            </Link>
          ) : (
            <button type="button" onClick={props.action.onClick} className={actionClassName}>
              {props.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
