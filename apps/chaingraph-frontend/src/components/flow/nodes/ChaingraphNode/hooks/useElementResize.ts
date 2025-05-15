/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useCallback, useEffect, useRef } from 'react'

interface ElementSize {
  width: number
  height: number
}

interface UseElementResizeOptions {
  debounceTime?: number
  onResize?: (size: ElementSize) => void
  minChangeThreshold?: number
  maxUpdatesPerSecond?: number
}

/**
 * Detects the browser zoom level using various methods
 * @returns The current browser zoom level (1 = 100%, 1.1 = 110%, etc.)
 */
export function detectBrowserZoom(): number {
  // Method 1: Using visual viewport API (modern browsers)
  if (window.visualViewport?.scale) {
    return window.visualViewport.scale
  }

  // Method 2: Calculate zoom by comparing actual width to ideal width
  // Create a temporary measuring element
  const tempEl = document.createElement('div')
  tempEl.style.width = '100vw'
  tempEl.style.height = '0'
  tempEl.style.position = 'absolute'
  tempEl.style.top = '0'
  tempEl.style.left = '0'
  tempEl.style.visibility = 'hidden'

  document.body.appendChild(tempEl)
  const idealWidth = tempEl.getBoundingClientRect().width
  document.body.removeChild(tempEl)

  // If idealWidth is valid, compare with innerWidth
  if (idealWidth > 0) {
    const ratio = window.innerWidth / idealWidth
    // Only return if it seems like a reasonable zoom value
    if (ratio > 0.5 && ratio < 5) {
      return ratio
    }
  }

  // Method 3: Fallback to 1 if we can't detect
  return 1
}

/**
 * Hook to track element size changes with debouncing
 * @param options Configuration options
 * @returns Object with ref to attach to the element
 */
export function useElementResize<T extends HTMLElement = HTMLDivElement>({
  debounceTime = 200,
  onResize,
  minChangeThreshold = 0.5,
  maxUpdatesPerSecond = 2, // Max updates per second (default: 2)
}: UseElementResizeOptions = {}) {
  const elementRef = useRef<T>(null)
  const lastReportedSizeRef = useRef<ElementSize>({ width: 0, height: 0 })
  const lastSizeRef = useRef<ElementSize>({ width: 0, height: 0 })
  const lastUpdateTimeRef = useRef<number>(0)
  const isInitializedRef = useRef<boolean>(false)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isResizingRef = useRef<boolean>(false)
  const minUpdateIntervalMs = maxUpdatesPerSecond ? (1000 / maxUpdatesPerSecond) : 0
  const zoomLevelRef = useRef<number>(1)

  // Update zoom level on mount and on resize
  useEffect(() => {
    // Set initial zoom level
    zoomLevelRef.current = detectBrowserZoom()

    // Update zoom level on window resize (which happens when zooming)
    const updateZoomLevel = () => {
      zoomLevelRef.current = detectBrowserZoom()
    }

    window.addEventListener('resize', updateZoomLevel)
    return () => window.removeEventListener('resize', updateZoomLevel)
  }, [])

  // This function checks if we should allow an update based on time constraints
  const shouldAllowUpdate = useCallback(() => {
    const now = Date.now()
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current
    return timeSinceLastUpdate >= minUpdateIntervalMs
  }, [minUpdateIntervalMs])

  const processSizeChange = useCallback(() => {
    const { width, height } = lastSizeRef.current

    // Only trigger if dimensions have changed significantly from the last reported size
    if (
      !isInitializedRef.current
      || Math.abs(width - lastReportedSizeRef.current.width) > minChangeThreshold
      || Math.abs(height - lastReportedSizeRef.current.height) > minChangeThreshold
    ) {
      // Update the last reported size
      lastReportedSizeRef.current = { width, height }
      lastUpdateTimeRef.current = Date.now()
      isInitializedRef.current = true

      onResize?.({ width, height })
    }

    isResizingRef.current = false
  }, [onResize, minChangeThreshold])

  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    if (!entries.length)
      return

    const entry = entries[entries.length - 1] // Use only the most recent entry

    // Extract size from the entry
    let width = 0
    let height = 0

    if (entry.borderBoxSize && entry.borderBoxSize.length > 0) {
      width = entry.borderBoxSize[0].inlineSize
      height = entry.borderBoxSize[0].blockSize
    } else {
      const rect = (entry.target as HTMLElement).getBoundingClientRect()
      width = rect.width
      height = rect.height
    }

    // Normalize measurements based on browser zoom level
    // This ensures consistent sizing regardless of user's browser zoom
    const zoomLevel = zoomLevelRef.current
    if (zoomLevel !== 1) {
      width = width / zoomLevel
      height = height / zoomLevel
    }

    // Store the current size
    lastSizeRef.current = { width, height }

    // If this is the first size measurement, report immediately
    if (!isInitializedRef.current) {
      processSizeChange()
      return
    }

    isResizingRef.current = true

    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // If we're allowed to update now based on rate limiting, and the change is significant
    if (shouldAllowUpdate()
      && (Math.abs(width - lastReportedSizeRef.current.width) > minChangeThreshold
        || Math.abs(height - lastReportedSizeRef.current.height) > minChangeThreshold)) {
      processSizeChange()
    }

    // Always set a final timeout to ensure we capture the last size
    debounceTimeoutRef.current = setTimeout(() => {
      if (isResizingRef.current) {
        processSizeChange()
      }
    }, debounceTime)
  }, [debounceTime, processSizeChange, shouldAllowUpdate, minChangeThreshold])

  useEffect(() => {
    const element = elementRef.current
    if (!element)
      return

    // Reset the initialization state
    isInitializedRef.current = false

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(element)

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)

        // Ensure the final size gets processed when component unmounts
        if (isResizingRef.current) {
          processSizeChange()
        }
      }
      resizeObserver.disconnect()
    }
  }, [handleResize, processSizeChange])

  return { ref: elementRef }
}
