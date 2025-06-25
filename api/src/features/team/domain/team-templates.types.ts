export type CreateTeamTemplateInput = {
  description: string
  key: string
  name: string
}

export type TeamTemplate = {
  id: string
  name: string
  description: string | null
  key: string
}
