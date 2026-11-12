// Husky post-merge / post-checkout: reinstall the packages whose lockfile moved
// between two commits, so node_modules never lags behind a pull or branch switch.
// Usage: node scripts/hooks/sync-deps.mjs <from-ref> <to-ref>
import { execFileSync, spawnSync } from 'node:child_process'
import { platform } from 'node:os'
import { packagesWithChangedLockfile } from './lockfile-packages.mjs'

// git passes an all-zero sha as <from> when a worktree is first checked out;
// scripts/hooks/worktree-create.mjs installs those.
const NULL_SHA = /^0+$/

const [from, to] = process.argv.slice(2)

const changedFiles = () =>
  execFileSync('git', ['diff', '--name-only', from, to], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)

const main = () => {
  if (!from || !to || NULL_SHA.test(from)) return

  const packages = packagesWithChangedLockfile(changedFiles())
  packages.forEach((pkg) => {
    console.log(`sync-deps: ${pkg} › npm install (package-lock.json changed)`)
    const result = spawnSync('npm', ['install', '--no-audit', '--no-fund'], {
      cwd: pkg,
      stdio: 'inherit',
      shell: platform() === 'win32',
    })
    if (result.status !== 0) console.error(`sync-deps: npm install failed in ${pkg}; run it by hand.`)
  })
}

main()
