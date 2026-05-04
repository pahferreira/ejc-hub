import { useEffect, useRef, useState } from 'react'

export function useCountdown(initialSeconds: number, onComplete: () => void) {
  const [seconds, setSeconds] = useState(initialSeconds)
  // Guard against StrictMode double-firing of onComplete
  const firedRef = useRef(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          if (!firedRef.current) {
            firedRef.current = true
            onComplete()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [onComplete])

  return seconds
}
