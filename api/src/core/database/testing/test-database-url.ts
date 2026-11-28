import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import path from 'node:path'

// The compose Postgres (`docker compose up -d db` in api/).
const LOCAL_SERVER_URL = 'postgres://ejc_hub:ejc_hub@localhost:5434'

// The database the DB specs (`*.db.spec.ts`) run against. An explicit
// TEST_DATABASE_URL wins (CI points it at its own Postgres service). Otherwise
// each worktree gets its own database on the compose Postgres, so pushes from
// parallel worktrees never truncate each other's rows or race on migrations.
// Global setup creates it on first use.
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? `${LOCAL_SERVER_URL}/${worktreeDatabaseName()}`

// `ejc_hub_<worktree>_<hash>_test`: the folder name keeps it readable, the hash
// of the full path keeps two same-named folders apart. Postgres caps names at
// 63 bytes, so the folder part is cut to 32.
export function worktreeDatabaseName(root = worktreeRoot()) {
  const slug =
    path
      .basename(root)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 32) || 'worktree'
  const hash = createHash('sha256').update(root).digest('hex').slice(0, 8)

  return `ejc_hub_${slug}_${hash}_test`
}

function worktreeRoot() {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return process.cwd()
  }
}

// Every DB spec starts by truncating every table, so the name is checked first:
// a TEST_DATABASE_URL pointing at a dev or prod database must not be wiped.
export function assertIsTestDatabase(url: string) {
  const name = databaseName(url)

  if (!name.endsWith('_test')) {
    throw new Error(
      `TEST_DATABASE_URL must name a database ending in "_test", got "${name}". DB specs truncate every table.`
    )
  }
}

export function databaseName(url: string) {
  return decodeURIComponent(new URL(url).pathname.slice(1))
}
