export type Circle = {
  key: string
  label: string
  color: string
}

export const circlesQueryKeys = {
  list: ['circles'] as const,
}
