import { useState } from 'react'
import { FiLogOut, FiSidebar } from 'react-icons/fi'
import { useAuthentication } from '../../hooks/useAuthentication'
import { hasPermission } from '../../../../common/permissions'
import { SidebarNavGroup } from './SidebarNavGroup'
import { SidebarUserInfo } from './SidebarUserInfo'
import { sidebarNavGroups } from './sidebar'
import type { SidebarNavGroup as SidebarNavGroupType } from './sidebar'

const STORAGE_KEY = 'ejc-sidebar-collapsed'

function getInitialCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export type SidebarViewProps = {
  groups: SidebarNavGroupType[]
  userName?: string
  userPicture?: string
  onLogout: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function SidebarView(props: SidebarViewProps) {
  return (
    <aside
      className={`sticky top-0 h-screen bg-white border-r border-secondary/30 flex flex-col transition-all duration-200 shrink-0 overflow-hidden ${
        props.isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className={`p-4 border-b border-secondary/30 ${props.isCollapsed ? 'px-3' : ''}`}>
        <div className={`flex items-center gap-2 ${props.isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-dark-brown flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">.EJC</span>
          </div>
          {!props.isCollapsed && (
            <span className="font-serif text-lg font-bold text-dark-brown">Ponto EJC</span>
          )}
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
      <div className="px-3 py-2">
        <button
          type="button"
          onClick={props.onToggleCollapse}
          title={props.isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          className="p-2 rounded-lg text-sm text-secondary-foreground/60 hover:bg-tertiary/50 transition-colors cursor-pointer border-0 bg-transparent"
        >
          <FiSidebar size={18} />
        </button>
      </div>

      {/* User info */}
      <SidebarUserInfo
        userName={props.userName}
        userPicture={props.userPicture}
        isCollapsed={props.isCollapsed}
      />
    </aside>
  )
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsed)
  const { permissions, user, logout } = useAuthentication()

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        // localStorage unavailable
      }
      return next
    })
  }

  const filteredGroups = sidebarNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.permission || hasPermission(permissions, item.permission)
      ),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <SidebarView
      groups={filteredGroups}
      userName={user?.name}
      userPicture={user?.picture}
      onLogout={logout}
      isCollapsed={isCollapsed}
      onToggleCollapse={toggleCollapsed}
    />
  )
}
