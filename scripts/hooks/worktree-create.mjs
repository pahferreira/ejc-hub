// Claude Code WorktreeCreate hook (.claude/settings.json). The hook replaces Claude
// Code's own `git worktree add`, so it also does what that step did: branch
// `worktree-<name>` off origin's default branch, and copy the .worktreeinclude files.
// On top of that it runs `npm ci` everywhere, so agents start with node_modules.
// Contract: JSON `{ name }` on stdin; the worktree path as the last stdout line;
// everything else goes to stderr.
import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { platform } from 'node:os'
import { dirname, join } from 'node:path'
import { NPM_PACKAGES } from './lockfile-packages.mjs'

const toStderr = { stdio: ['ignore', 2, 2] }

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()

const baseRef = () => {
  try {
    return git('rev-parse', '--abbrev-ref', 'origin/HEAD')
  } catch {
    return 'HEAD'
  }
}

// Literal paths only (the file holds `./api/.env`-style lines today), not gitignore globs.
const copyIncludedFiles = (root, worktree) => {
  const list = join(root, '.worktreeinclude')
  if (!existsSync(list)) return

  readFileSync(list, 'utf8')
    .split('\n')
    .map((line) => line.trim().replace(/^\.\//, ''))
    .filter((path) => path && !path.startsWith('#') && existsSync(join(root, path)))
    .forEach((path) => {
      mkdirSync(dirname(join(worktree, path)), { recursive: true })
      copyFileSync(join(root, path), join(worktree, path))
    })
}

const installPackages = (worktree) =>
  NPM_PACKAGES.forEach((pkg) => {
    console.error(`worktree-create: ${pkg} › npm ci`)
    const result = spawnSync('npm', ['ci', '--no-audit', '--no-fund'], {
      ...toStderr,
      cwd: join(worktree, pkg),
      shell: platform() === 'win32',
    })
    if (result.status !== 0) console.error(`worktree-create: npm ci failed in ${pkg}; run it in the worktree.`)
  })

const main = () => {
  const { name } = JSON.parse(readFileSync(0, 'utf8'))
  const root = git('rev-parse', '--show-toplevel')
  const worktree = join(root, '.claude', 'worktrees', name)

  execFileSync('git', ['worktree', 'add', '-b', `worktree-${name}`, worktree, baseRef()], toStderr)
  copyIncludedFiles(root, worktree)
  installPackages(worktree)

  console.log(worktree)
}

main()
