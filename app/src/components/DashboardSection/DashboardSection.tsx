import type { ReactNode } from 'react'

export type DashboardSectionProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

export function DashboardSection(props: DashboardSectionProps) {
  return (
    <section className="w-full">
      <div className="mb-4">
        <h2 className="m-0 text-xl font-bold text-gray-900">{props.title}</h2>
        {props.subtitle && <p className="mt-1 mb-0 text-sm text-gray-600">{props.subtitle}</p>}
      </div>
      <div>{props.children}</div>
    </section>
  )
}
