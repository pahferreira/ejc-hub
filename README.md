# ejc-hub

## Running the API Locally

1. Create a `.env` file at `api/.env`.
2. Copy the `.env-sample` content.
3. Install the dependencies with `npm i` at `./api`.
4. Initiate the database by running `docker compose up -d`.
5. Run `npm run dev` to start the development server.

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
