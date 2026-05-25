import { seedTeamTemplates } from './team-templates.seed.ts'
import { seedSubscriptions } from './subscriptions.seed.ts'

type SeedResult = Record<string, unknown>
type SeedRunner = () => Promise<SeedResult>

const seeds: Record<string, SeedRunner> = {
  'team-templates': seedTeamTemplates,
  subscriptions: seedSubscriptions,
}

const ALIASES = {
  all: ['team-templates', 'subscriptions'] as const,
}

function printAvailable() {
  console.log('Available seeds:')
  Object.keys(seeds).forEach((name) => console.log(`  - ${name}`))
  console.log('\nAliases:')
  Object.entries(ALIASES).forEach(([alias, members]) =>
    console.log(`  - ${alias} -> [${members.join(', ')}]`)
  )
}

async function runSeed(name: string): Promise<void> {
  const runner = seeds[name]
  if (!runner) {
    throw new Error(`Unknown seed "${name}".`)
  }
  console.log(`\n--> Running seed: ${name}`)
  const result = await runner()
  console.log(`<-- Done: ${name}`)
  console.log(result)
}

async function main() {
  const requested = process.argv[2]

  if (!requested) {
    console.error('Missing seed name. Usage: db:seed <name>')
    printAvailable()
    process.exit(1)
  }

  if (requested === '--list' || requested === 'list') {
    printAvailable()
    process.exit(0)
  }

  const targets =
    requested in ALIASES ? ALIASES[requested as keyof typeof ALIASES] : ([requested] as const)

  for (const target of targets) {
    await runSeed(target)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\nSeed failed:')
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
