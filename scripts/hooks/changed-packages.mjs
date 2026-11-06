export const PACKAGES = ['common', 'api', 'app']

// common/ is a dependency of api and app, so a change there re-checks both.
const AFFECTED_BY = {
  common: ['common', 'api', 'app'],
  api: ['api'],
  app: ['app'],
}

const packageOf = (file) => PACKAGES.find((pkg) => file.startsWith(`${pkg}/`))

export const changedPackages = (files) => {
  const affected = new Set(
    files.flatMap((file) => {
      const pkg = packageOf(file)
      return pkg ? AFFECTED_BY[pkg] : []
    }),
  )

  return PACKAGES.filter((pkg) => affected.has(pkg))
}
