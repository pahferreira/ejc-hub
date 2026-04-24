import { SidebarNavLink } from './SidebarNavLink'
import type { SidebarNavItem } from './sidebar'

type SidebarNavGroupProps = {
  title: string
  items: SidebarNavItem[]
  isCollapsed: boolean
}

export function SidebarNavGroup(props: SidebarNavGroupProps) {
  return (
    <div>
      {props.isCollapsed ? (
        <div className="border-t border-secondary/30 my-2 mx-2" />
      ) : (
        <h3 className="text-xs font-semibold text-secondary-foreground/50 uppercase tracking-wider mb-2 px-3">
          {props.title}
        </h3>
      )}
      <div className="space-y-1">
        {props.items.map((item) => (
          <SidebarNavLink
            key={item.path}
            path={item.path}
            label={item.label}
            icon={item.icon}
            isCollapsed={props.isCollapsed}
          />
        ))}
      </div>
    </div>
  )
}
