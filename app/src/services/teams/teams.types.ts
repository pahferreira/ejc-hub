export const teamOptionsQueryKeys = {
  all: ['team-options'] as const,
}

export type TeamOption = {
  key: string
  name: string
  description: string
}
