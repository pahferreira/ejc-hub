import type { ReactNode } from 'react'

export type SectionHeaderProps = {
  /** Optional icon rendered before the title. */
  icon?: ReactNode
  /** Section title. */
  title: string
  /** Optional right-aligned action (e.g. a button). Hidden when absent. */
  action?: ReactNode
}

export function SectionHeader(props: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {props.icon && (
          <span className="flex shrink-0 items-center text-dark-brown" aria-hidden="true">
            {props.icon}
          </span>
        )}
        <h3 className="m-0 font-serif text-lg text-dark-brown">{props.title}</h3>
      </div>
      {props.action && <div className="shrink-0">{props.action}</div>}
    </div>
  )
}
