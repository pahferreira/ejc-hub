import { PACKAGES } from './changed-packages.mjs'

// Per-package checks run on push. Package tickets add their own steps.
export const PRE_PUSH_STEPS = {
  common: [],
  api: [
    { name: 'typecheck', command: 'npm', args: ['run', 'typecheck'] },
    { name: 'test', command: 'npm', args: ['test'] },
  ],
  app: [
    { name: 'typecheck', command: 'npm', args: ['run', 'typecheck'] },
    { name: 'test', command: 'npm', args: ['test'] },
  ],
}

export const stepsFor = (packages, table = PRE_PUSH_STEPS) =>
  PACKAGES.filter((pkg) => packages.includes(pkg)).flatMap((pkg) => table[pkg])
