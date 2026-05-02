import type { ReactNode } from 'react'

type ReviewFieldProps = {
  label: string
  value: ReactNode
}

export function ReviewField(props: ReviewFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm text-gray-500">{props.label}</dt>
      <dd className="text-base font-medium text-gray-900">{props.value || '—'}</dd>
    </div>
  )
}
