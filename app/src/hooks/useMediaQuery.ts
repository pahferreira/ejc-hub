import { useCallback, useSyncExternalStore } from 'react'

/**
 * Subscribes to a CSS media query and re-renders when it starts or stops
 * matching. Use it only when a breakpoint has to drive behaviour (mounting,
 * state) — plain visibility belongs in a `md:` utility class.
 */
export const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mediaQuery = window.matchMedia(query)
      mediaQuery.addEventListener('change', onStoreChange)
      return () => mediaQuery.removeEventListener('change', onStoreChange)
    },
    [query]
  )

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])

  return useSyncExternalStore(subscribe, getSnapshot)
}
