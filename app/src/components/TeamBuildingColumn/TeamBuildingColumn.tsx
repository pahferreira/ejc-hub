import clsx from 'clsx'
import type { ReactNode } from 'react'
import { Children } from 'react'

export type TeamBuildingColumnVariant = 'default' | 'dashed' | 'transparent'

export type TeamBuildingColumnProps = {
  /** Bold heading shown at the top-left of the column (e.g. "Liturgia"). */
  title: string
  /** Optional muted line under the title. Hidden when absent. */
  description?: string
  /** Current number of members in the column. */
  count: number
  /** When present, the count renders as "count/max" (bold count, muted "/max"). */
  max?: number
  /** Surface style. Default 'default' (white card with header divider). */
  variant?: TeamBuildingColumnVariant
  /** Placeholder text shown when the column has no children. */
  emptyLabel?: string
  /** Optional drag handle rendered at the start of the header (e.g. for reordering). */
  dragHandle?: ReactNode
  /** Member cards. When empty, the placeholder is shown instead. */
  children?: ReactNode
}

const surfaceByVariant: Record<TeamBuildingColumnVariant, string> = {
  default: 'bg-white border border-tertiary shadow-md',
  dashed: 'bg-tertiary-background border border-dashed border-secondary',
  transparent: 'bg-tertiary-background border-none shadow-none',
}

export function TeamBuildingColumn({
  variant = 'default',
  emptyLabel = 'Arraste membros para cá',
  ...props
}: TeamBuildingColumnProps) {
  const isEmpty = Children.count(props.children) === 0

  return (
    <section
      aria-label={props.title}
      className={clsx(
        'relative flex w-full flex-col gap-3 rounded-xl px-4 pt-5 pb-4 transition-colors',
        surfaceByVariant[variant]
      )}
    >
      <span
        aria-hidden="true"
        className="absolute top-5 left-0 h-12 w-1.5 rounded-r-md bg-dark-brown"
      />

      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          {props.dragHandle}
          <div className="flex min-w-0 flex-col gap-0.5">
            <h3 className="font-semibold text-dark-brown">{props.title}</h3>
            {props.description && (
              <p className="m-0 text-sm text-secondary-foreground">{props.description}</p>
            )}
          </div>
        </div>

        <span className="shrink-0 text-sm font-semibold text-dark-brown">
          {props.count}
          {props.max !== undefined && (
            <span className="font-normal text-secondary-foreground">/{props.max}</span>
          )}
        </span>
      </header>

      {variant === 'default' && <hr className="m-0 border-t border-tertiary" />}

      <div className="flex flex-col gap-3">
        {isEmpty ? (
          <p className="m-0 py-6 text-center text-sm text-secondary-foreground italic">
            {emptyLabel}
          </p>
        ) : (
          props.children
        )}
      </div>
    </section>
  )
}
