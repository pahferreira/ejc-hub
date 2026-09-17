import type { ReactNode } from 'react'
import { FiLogOut, FiSidebar } from 'react-icons/fi'
import { SidebarNavGroup } from './SidebarNavGroup'
import { SidebarUserInfo } from './SidebarUserInfo'
import type { SidebarNavGroup as SidebarNavGroupType } from './sidebarNav'
import { Logo } from '../Logo/Logo'

/**
 * Everything the sidebar needs regardless of how it is presented. Shared by the
 * desktop rail (`SidebarView`) and the mobile overlay (`MobileSidebar`).
 */
export type SidebarNavProps = {
  groups: SidebarNavGroupType[]
  userName?: string
  userNickname?: string
  userPicture?: string
  onLogout: () => void
}

export type SidebarContentProps = SidebarNavProps & {
  isCollapsed: boolean
  /** Omitted by the mobile overlay: collapsing an overlay makes no sense. */
  onToggleCollapse?: () => void
  /** Rendered next to the logo. The mobile overlay puts its close button here. */
  headerAction?: ReactNode
}

export function SidebarContent(props: SidebarContentProps) {
  const { onToggleCollapse } = props

  return (
    <>
      {/* Logo */}
      <div className={`p-4 border-b border-secondary/30 ${props.isCollapsed ? 'px-3' : ''}`}>
        <div
          className={`flex items-center gap-2 ${
            props.isCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <Logo iconOnly={props.isCollapsed} />
          {props.headerAction}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4">
        {props.groups.map((group) => (
          <SidebarNavGroup
            key={group.title}
            title={group.title}
            items={group.items}
            isCollapsed={props.isCollapsed}
          />
        ))}

        {/* Logout */}
        <div>
          {props.isCollapsed ? (
            <div className="border-t border-secondary/30 my-2 mx-2" />
          ) : (
            <h3 className="text-xs font-semibold text-secondary-foreground/50 uppercase tracking-wider mb-2 px-3">
              LOGOUT
            </h3>
          )}
          <button
            type="button"
            onClick={props.onLogout}
            title={props.isCollapsed ? 'Sair da conta' : undefined}
            className={`w-full flex items-center py-2 rounded-lg text-sm text-red font-medium hover:bg-red/5 transition-colors cursor-pointer border-0 bg-transparent ${
              props.isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
            }`}
          >
            <FiLogOut size={18} className="shrink-0" />
            {!props.isCollapsed && <span>Sair da conta</span>}
          </button>
        </div>
      </nav>

      {/* Collapse toggle */}
      {onToggleCollapse && (
        <div className="px-3 py-2">
          <button
            type="button"
            onClick={onToggleCollapse}
            title={props.isCollapsed ? 'Expandir menu' : 'Recolher menu'}
            className="p-2 rounded-lg text-sm text-secondary-foreground/60 hover:bg-sidebar-highlight transition-colors cursor-pointer border-0 bg-transparent"
          >
            <FiSidebar size={18} />
          </button>
        </div>
      )}

      {/* User info */}
      <SidebarUserInfo
        userName={props.userName}
        userNickname={props.userNickname}
        userPicture={props.userPicture}
        isCollapsed={props.isCollapsed}
      />
    </>
  )
}
