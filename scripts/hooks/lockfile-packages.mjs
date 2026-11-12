// Every directory with its own package-lock.json, root first.
export const NPM_PACKAGES = ['.', 'common', 'api', 'app']

const lockfileOf = (pkg) => (pkg === '.' ? 'package-lock.json' : `${pkg}/package-lock.json`)

export const packagesWithChangedLockfile = (files) =>
  NPM_PACKAGES.filter((pkg) => files.includes(lockfileOf(pkg)))
