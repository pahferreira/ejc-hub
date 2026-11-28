import { configDefaults, defineWorkspace } from 'vitest/config'
import { TEST_DATABASE_URL } from './src/core/database/testing/test-database-url.ts'

const shared = {
  environment: 'node',
  globals: true,
} as const

export default defineWorkspace([
  {
    test: {
      ...shared,
      name: 'unit',
      include: ['**/*.spec.ts', '**/*.test.ts'],
      exclude: [...configDefaults.exclude, '**/*.db.spec.ts'],
    },
  },
  {
    test: {
      ...shared,
      name: 'db',
      include: ['src/**/*.db.spec.ts'],
      globalSetup: ['./src/core/database/testing/global-setup.ts'],
      setupFiles: ['./src/core/database/testing/setup-db-spec.ts'],
      // One database shared by every DB spec, truncated before each test: files
      // run one at a time, in one fork, so they cannot wipe each other's rows.
      pool: 'forks',
      poolOptions: { forks: { singleFork: true } },
      env: {
        DATABASE_URL: TEST_DATABASE_URL,
        // env.ts requires these at import; no DB spec talks to Auth0.
        AUTH_TENANT_DOMAIN: 'test.invalid',
        AUTH_AUDIENCE: 'test',
      },
    },
  },
])
