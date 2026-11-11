/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest'

// Files that hold no function, so they have nothing to spec.
const NO_SPEC_NEEDED = /(\.spec|\.constants|\.types|\.config|\/index)\.ts$/

/** The source files of common that should each sit beside a `<name>.spec.ts`. */
function sourcesMissingSpec(paths: string[]): string[] {
  const all = new Set(paths)
  return paths
    .filter((path) => !NO_SPEC_NEEDED.test(path))
    .filter((path) => !all.has(path.replace(/\.ts$/, '.spec.ts')))
}

describe('common spec siblings', () => {
  it('has a <name>.spec.ts beside every source file', () => {
    const paths = Object.keys(import.meta.glob('./**/*.ts'))

    expect(sourcesMissingSpec(paths)).toEqual([])
  })

  it('reports a source file that has no spec beside it', () => {
    expect(
      sourcesMissingSpec([
        './schedule/toEventDate.ts',
        './schedule/toEventDate.spec.ts',
        './a/b.ts',
      ])
    ).toEqual(['./a/b.ts'])
  })
})
