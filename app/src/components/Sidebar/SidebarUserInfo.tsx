import { FiUser } from 'react-icons/fi'

type SidebarUserInfoProps = {
  userName?: string
  userNickname?: string
  userPicture?: string
  isCollapsed: boolean
}

export function SidebarUserInfo(props: SidebarUserInfoProps) {
  const displayName = props.userNickname || props.userName

  return (
    <div
      className={`border-t border-secondary/30 px-4 py-4 ${props.isCollapsed ? 'flex justify-center' : ''}`}
    >
      <div
        className={`flex items-center gap-3 ${props.isCollapsed ? 'justify-center' : ''}`}
        title={props.isCollapsed ? displayName : undefined}
      >
        {props.userPicture ? (
          <img
            src={props.userPicture}
            alt={displayName}
            className="w-9 h-9 rounded-full shrink-0 object-cover"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-dark-brown flex items-center justify-center shrink-0">
            <FiUser size={16} className="text-white" />
          </div>
        )}
        {!props.isCollapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-dark-brown leading-tight truncate m-0">
              {displayName ?? 'Usuário'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
