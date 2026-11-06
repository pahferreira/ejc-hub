import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { homedir, platform } from 'node:os'
import { join } from 'node:path'
import { changedPackages } from './changed-packages.mjs'
import { stepsFor } from './pre-push-steps.mjs'

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()

const mergeBase = () => {
  try {
    return git('merge-base', 'origin/main', 'HEAD')
  } catch {
    return fail('Cannot find origin/main. Run "git fetch origin main" and push again.')
  }
}

const changedFiles = () => {
  const base = mergeBase()
  return git('diff', '--name-only', base, 'HEAD').split('\n').filter(Boolean)
}

const fail = (message) => {
  console.error(`pre-push: ${message}`)
  process.exit(1)
}

const missingNodeModules = (packages) =>
  packages.filter((pkg) => !existsSync(join(pkg, 'node_modules')))

const playwrightBrowsersPath = () => {
  if (process.env.PLAYWRIGHT_BROWSERS_PATH) return process.env.PLAYWRIGHT_BROWSERS_PATH
  if (platform() === 'darwin') return join(homedir(), 'Library', 'Caches', 'ms-playwright')
  if (platform() === 'win32') {
    return join(process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local'), 'ms-playwright')
  }
  return join(homedir(), '.cache', 'ms-playwright')
}

const chromiumInstalled = () => {
  const dir = playwrightBrowsersPath()
  return existsSync(dir) && readdirSync(dir).some((entry) => entry.startsWith('chromium-'))
}

const runStep = (pkg, { name, command, args }) => {
  console.log(`pre-push: ${pkg} › ${name}`)
  const result = spawnSync(command, args, {
    cwd: pkg,
    stdio: 'inherit',
    shell: platform() === 'win32',
  })
  if (result.status !== 0) fail(`${pkg} › ${name} failed.`)
}

const main = () => {
  const packages = changedPackages(changedFiles())
  if (packages.length === 0) {
    console.log('pre-push: no package changes since origin/main, skipping checks.')
    return
  }

  const missing = missingNodeModules(packages)
  if (missing.length > 0) {
    const install = missing.map((pkg) => `  cd ${pkg} && npm install`).join('\n')
    fail(`node_modules is missing for: ${missing.join(', ')}.\nInstall them, then push again:\n${install}`)
  }

  if (!chromiumInstalled()) {
    fail(
      'Chromium for Playwright is missing. Install it with "cd app && npx playwright install chromium" (see README), then push again.',
    )
  }

  packages.forEach((pkg) => stepsFor([pkg]).forEach((step) => runStep(pkg, step)))
  console.log(`pre-push: checks passed for ${packages.join(', ')}.`)
}

main()
