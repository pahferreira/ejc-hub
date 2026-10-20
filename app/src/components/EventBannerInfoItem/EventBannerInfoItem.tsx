import type { IconType } from 'react-icons'

export type EventBannerInfoItemProps = {
  icon: IconType
  label: string
  value: string
}

export function EventBannerInfoItem(props: EventBannerInfoItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
        <props.icon size={18} aria-hidden />
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="text-xs text-white/70">{props.label}</span>
        <span className="break-words text-sm font-semibold">{props.value}</span>
      </div>
    </div>
  )
}
