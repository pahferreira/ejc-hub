# ejc-hub

## Running the API Locally

1. Create a `.env` file at `api/.env`.
2. Copy the `.env-sample` content.
3. Install the dependencies with `npm i` at `./api`.
4. Initiate the database by running `docker compose up -d`.
5. Run `npm run dev` to start the development server.

## API tests

`npm test` in `api/` runs two Vitest projects:

- **unit** (`npm run test:unit`): every `*.spec.ts`, with the database mocked.
- **db** (`npm run test:db`): every `*.db.spec.ts`, against a real Postgres 17. It migrates the test database once, then truncates every table before each test.

The db project uses `TEST_DATABASE_URL`, which defaults to the `ejc_hub_test` database of the compose Postgres (`postgres://ejc_hub:ejc_hub@localhost:5434/ejc_hub_test`). Start it with `docker compose up -d db` in `api/`. The database is created on the container's first start (`api/docker/create-test-db.sql`). If it is down, `npm test` fails with a message saying so, never skips. The name must end in `_test`: the db project refuses any other database, since it truncates every table.

The pre-push hook runs `npm test`, so pushing an `api` change needs the test database up.

## Git Hooks

Running `npm install` at the root installs the Husky hooks.

- **pre-commit** runs `lint-staged` on the staged files and re-stages any files the tasks fix.
- **pre-push** finds the packages changed since `origin/main` and runs the checks from `scripts/hooks/pre-push-steps.mjs`. It never installs anything, so it fails with an actionable message when:
  - `node_modules` is missing for a changed package (run `npm install` in that package).
  - Chromium is missing and `app` is being checked (see below).

## Installing Chromium

The browser tests and the `app` pre-push checks need Chromium for Playwright. Install it from `app/`:

```sh
cd app
npx playwright install chromium
```

On Linux, also run `npx playwright install-deps chromium` to get the system libraries.
