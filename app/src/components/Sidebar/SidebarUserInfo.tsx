import { FiUser } from 'react-icons/fi'

type SidebarUserInfoProps = {
  userName?: string
  userPicture?: string
  isCollapsed: boolean
}

export function SidebarUserInfo(props: SidebarUserInfoProps) {
  const [firstName, lastName] = props.userName?.split(' ') ?? []
  const firstInitial = firstName?.charAt(0)?.toUpperCase() ?? ''
  const lastInitial = lastName?.charAt(0)?.toUpperCase() ?? ''
  const initials = `${firstInitial}${lastInitial}` || 'U'

  return (
    <div
      className={`border-t border-secondary/30 px-4 py-4 ${props.isCollapsed ? 'flex justify-center' : ''}`}
    >
      <div
        className={`flex items-center gap-3 ${props.isCollapsed ? 'justify-center' : ''}`}
        title={props.isCollapsed ? props.userName : undefined}
      >
        {props.userPicture ? (
          <img
            src={props.userPicture}
            alt={props.userName}
            className="w-9 h-9 rounded-full shrink-0 object-cover"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-dark-brown flex items-center justify-center shrink-0">
            {props.userName ? (
              <span className="text-white font-semibold text-sm">{initials}</span>
            ) : (
              <FiUser size={16} className="text-white" />
            )}
          </div>
        )}
        {!props.isCollapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-dark-brown leading-tight truncate m-0">
              {props.userName ?? 'Usuário'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
