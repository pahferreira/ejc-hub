import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.spec.ts', '**/*.test.ts'],
    // Common runs in browsers and servers in any zone. Pinning the suite far
    // from São Paulo catches code that leans on the machine's own clock.
    env: { TZ: 'Asia/Tokyo' },
  },
})
