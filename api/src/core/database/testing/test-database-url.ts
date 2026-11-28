// The database the DB specs (`*.db.spec.ts`) run against. Defaults to the
// `ejc_hub_test` database that `docker compose up -d db` creates
// (docker/create-test-db.sql); CI points it at its own Postgres service.
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://ejc_hub:ejc_hub@localhost:5434/ejc_hub_test'

// Every DB spec starts by truncating every table, so the name is checked first:
// a TEST_DATABASE_URL pointing at a dev or prod database must not be wiped.
export function assertIsTestDatabase(url: string) {
  const name = new URL(url).pathname.slice(1)

  if (!name.endsWith('_test')) {
    throw new Error(
      `TEST_DATABASE_URL must name a database ending in "_test", got "${name}". DB specs truncate every table.`
    )
  }
}
