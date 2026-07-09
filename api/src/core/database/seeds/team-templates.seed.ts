import { db } from '../client.ts'
import { schema } from '../schemas/index.ts'

type TeamTemplateSeed = {
  key: string
  name: string
  description: string
  maxCapacity: number
}

const TEAM_TEMPLATES: TeamTemplateSeed[] = [
  {
    key: 'apresentadores',
    name: 'Apresentadores',
    description:
      'Responsáveis por conduzir o encontro de forma dinâmica e espontânea, levando os encontristas a vivenciarem a espiritualidade e fraternidade que transbordam no encontro.',
    maxCapacity: 2,
  },
  {
    key: 'bandinha',
    name: 'Bandinha',
    description:
      'Quem canta reza duas vezes! Essa equipe é responsável pela escolha e execução dos cânticos das missas (entrega e final) e também das músicas durante todo o encontro, como em peças e corredores.',
    maxCapacity: 40,
  },
  {
    key: 'boa_vontade',
    name: 'Boa Vontade',
    description:
      'Encarregada de dar suporte as necessidades básicas dos encontristas durante o encontro, auxiliando nas idas aos banheiros, servindo água e etc.',
    maxCapacity: 20,
  },
  {
    key: 'circulos',
    name: 'Círculos',
    description:
      'São o abraço de Deus para os encontristas. Os círculos está em contato direto com os encontristas, conduzindo os momentos de dinâmicas e partilhas em sala, sendo ouvido atento para a voz dos jovens.',
    maxCapacity: 9,
  },
  {
    key: 'cozinha',
    name: 'Cozinha',
    description:
      'Responsáveis por trazer sustento ao encontro através do alimento, providenciando o almoço e jantar do Encontro para todos os encontristas e encontreiros.',
    maxCapacity: 20,
  },
  {
    key: 'lanchinho',
    name: 'Lanchinho',
    description:
      'Coma coma coma um biscoitinho! Responsáveis por preparar e servir os lanches que conectam as pessoas através da partilha fraterna.',
    maxCapacity: 20,
  },
  {
    key: 'liturgia',
    name: 'Liturgia',
    description:
      'Garantem a parte litúrgica do encontro, contemplando as missas de entrega e encerramento do encontro. Além de preparar as vivências da Santa Ceia, Momento Mariano e Deserto através da dança e do teatro.',
    maxCapacity: 22,
  },
  {
    key: 'midias',
    name: 'Midias',
    description:
      'Dedicada a capturar os sentimentos vividos durante o encontro através das mídias, além de evangelizar de forma moderna pelas redes sociais.',
    maxCapacity: 5,
  },
  {
    key: 'minibox',
    name: 'Minibox',
    description:
      'Sustentam os bastidores disponibilizando um local de descontração para os encontreiros, além do suporte financeiro ao encontro através da venda de lanches, artigos religiosos e afins.',
    maxCapacity: 20,
  },
  {
    key: 'ordem',
    name: 'Ordem e Limpeza',
    description:
      'Mantém o encontro em ordem provendo a higiene pessoal e a limpeza dos locais utilizados pelos encontristas.',
    maxCapacity: 20,
  },
  {
    key: 'padrinhos',
    name: 'Padrinhos Adotivos',
    description:
      'São a ponte entre a família do encontrista e o EJC, responsáveis por transportar os encontristas até o encontro, assim como o retorno para suas casas.',
    maxCapacity: 50,
  },
  {
    key: 'recepcao_aos_visitantes',
    name: 'Recepção aos Visitantes',
    description:
      'Abraços que acolhem e recepcionam palestrantes e visitantes, apresentando nossa casa e trazendo um pouco da vivência do EJC.',
    maxCapacity: 14,
  },
  {
    key: 'secretaria_e_correios',
    name: 'Secretaria e Correios',
    description:
      'Carinho transcrito em papel. Garantem que as orações sejam entregues através de uma cartinha. Além de providenciar os quadrante e hinários do encontro.',
    maxCapacity: 20,
  },
  {
    key: 'sociotransito',
    name: 'Sóciotrânsito',
    description:
      'A alegria do Senhor é a nossa força! Responsáveis pelas brincadeiras de integração e pelas peças que evangelizam todo o encontro.',
    maxCapacity: 40,
  },
  {
    key: 'som_e_iluminacao',
    name: 'Som e Iluminação',
    description:
      'Responsáveis por entregar o suporte de som e iluminação necessários para que a mensagem seja passada de forma clara e sonora.',
    maxCapacity: 12,
  },
  {
    key: 'vigilia',
    name: 'Vigília',
    description:
      'O coração do nosso encontro. Responsáveis por garantir a unidade espiritual do encontro através da força da oração.',
    maxCapacity: 20,
  },
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
