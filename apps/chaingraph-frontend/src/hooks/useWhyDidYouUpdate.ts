/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useEffect, useRef } from 'react'

/**
 * Custom hook to debug why a component re-rendered
 * Logs which props changed between renders
 *
 * @param name - Component name for logging
 * @param props - Props object to track
 */
export function useWhyDidYouUpdate<T extends Record<string, any>>(
  name: string,
  props: T,
): void {
  // Get previous props
  const previousProps = useRef<T>()

  useEffect(() => {
    if (previousProps.current) {
      // Get all keys from both current and previous props
      const allKeys = Object.keys({ ...previousProps.current, ...props })
      const changedProps: Record<string, { from: any; to: any }> = {}

      // Check what changed
      allKeys.forEach((key) => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
          }
        }
      })

      // Log if there were changes
      if (Object.keys(changedProps).length > 0) {
        console.log('[WHY-UPDATE]', name, 'changed props:', changedProps)
      } else {
        console.log('[WHY-UPDATE]', name, 'rendered with no prop changes (hooks/state?)')
      }
    } else {
      console.log('[WHY-UPDATE]', name, 'initial render')
    }

    // Update previous props for next render
    previousProps.current = props
  })
}

/**
 * Hook to track render count
 * Useful for identifying components that render too frequently
 */
export function useRenderCount(name: string): void {
  const renderCount = useRef(0)
  renderCount.current++

  useEffect(() => {
    console.log(`[RENDER-COUNT] ${name}: render #${renderCount.current}`)
  })
}