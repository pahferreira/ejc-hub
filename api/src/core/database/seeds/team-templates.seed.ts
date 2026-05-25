import { db } from '../client.ts'
import { schema } from '../schemas/index.ts'

type TeamTemplateSeed = {
  key: string
  name: string
}

const TEAM_TEMPLATES: TeamTemplateSeed[] = [
  { key: 'apresentadores', name: 'Apresentadores' },
  { key: 'bandinha', name: 'Bandinha' },
  { key: 'boa_vontade', name: 'Boa Vontade' },
  { key: 'cozinha', name: 'Cozinha' },
  { key: 'circulos', name: 'Círculos' },
  { key: 'lanchinho', name: 'Lanchinho' },
  { key: 'liturgia', name: 'Liturgia' },
  { key: 'midias', name: 'Midias' },
  { key: 'minibox', name: 'Minibox' },
  { key: 'ordem', name: 'Ordem' },
  { key: 'padrinhos', name: 'Padrinhos' },
  { key: 'recepcao_aos_visitantes', name: 'Recepção aos Visitantes' },
  { key: 'secretaria_e_correios', name: 'Secretaria e Correios' },
  { key: 'sociotransito', name: 'Sociotransito' },
  { key: 'som_e_iluminacao', name: 'Som e Iluminação' },
  { key: 'vigilia', name: 'Vigília' },
]

export const TEAM_TEMPLATE_KEYS = TEAM_TEMPLATES.map((t) => t.key)

export async function seedTeamTemplates() {
  const inserted = await db
    .insert(schema.teamTemplates)
    .values(TEAM_TEMPLATES)
    .onConflictDoNothing({ target: schema.teamTemplates.key })
    .returning({
      id: schema.teamTemplates.id,
      key: schema.teamTemplates.key,
    })

  return {
    attempted: TEAM_TEMPLATES.length,
    inserted: inserted.length,
    skipped: TEAM_TEMPLATES.length - inserted.length,
  }
}
