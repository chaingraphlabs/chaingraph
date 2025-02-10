import { useEffect, useRef } from 'react'

interface UseResizeObserverProps {
  onResize?: (entry: ResizeObserverEntry, isUserInteraction: boolean) => void
}

export function useResizeObserver({ onResize }: UseResizeObserverProps) {
  const elementRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element || !onResize)
      return

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        // Check if resize was triggered by user interaction
        const isUserInteraction = 'devicePixelContentBoxSize' in entry
        onResize(entry, isUserInteraction)
      }
    })

    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
    }
  }, [onResize])

  return elementRef
}
