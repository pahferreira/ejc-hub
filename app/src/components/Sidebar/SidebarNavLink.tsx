import { NavLink } from 'react-router'
import type { IconType } from 'react-icons'

type SidebarNavLinkProps = {
  path: string
  label: string
  icon: IconType
  isCollapsed: boolean
}

export function SidebarNavLink(props: SidebarNavLinkProps) {
  const Icon = props.icon

  return (
    <NavLink
      to={props.path}
      title={props.isCollapsed ? props.label : undefined}
      className={({ isActive }) =>
        `flex items-center py-2 rounded-lg text-sm transition-colors no-underline ${
          isActive
            ? 'bg-tertiary text-dark-brown font-medium'
            : 'text-secondary-foreground/80 hover:bg-tertiary/50'
        } ${props.isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'}`
      }
    >
      <Icon size={18} className="shrink-0" />
      <span
        className={`whitespace-nowrap transition-all duration-200 ${
          props.isCollapsed ? 'opacity-0 invisible w-0' : 'opacity-100 visible'
        }`}
      >
        {props.label}
      </span>
    </NavLink>
  )
}
