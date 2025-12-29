/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ComponentType, FC } from 'react'
import type { PerfTrace, TraceStartOptions } from './types'
import { memo, useEffect, useRef } from 'react'

/**
 * Options for traceRender HOC
 */
export interface TraceRenderOptions extends TraceStartOptions {
  /**
   * Whether to trace every render or only on specific conditions
   */
  traceOnlyWhen?: (props: Record<string, unknown>) => boolean
}

/**
 * Higher-order component that traces React component renders.
 *
 * Wraps a component with performance tracing for each render.
 *
 * @param trace PerfTrace instance
 * @param Component React component to trace
 * @param name Name for the trace (e.g., 'render.MyComponent')
 * @param options Additional trace options
 *
 * @example
 * ```ts
 * const TracedNode = traceRender(trace, ChaingraphNode, 'render.ChaingraphNode')
 * // Use TracedNode instead of ChaingraphNode
 * ```
 */
export function traceRender<P extends object>(
  trace: PerfTrace,
  Component: ComponentType<P>,
  name: string,
  options: TraceRenderOptions = {},
): FC<P> {
  const TracedComponent: FC<P> = (props) => {
    // Track render count for this instance
    const renderCountRef = useRef(0)
    const mountTimeRef = useRef<number>(0)

    // Trace render
    const shouldTrace = !options.traceOnlyWhen || options.traceOnlyWhen(props as Record<string, unknown>)

    if (shouldTrace && trace.isEnabled()) {
      renderCountRef.current++

      const spanId = trace.start(name, {
        ...options,
        category: options.category ?? 'render',
        tags: {
          ...options.tags,
          renderCount: renderCountRef.current,
        },
      })

      // End span after render completes
      // Using queueMicrotask to measure after React commits
      queueMicrotask(() => {
        trace.end(spanId)
      })
    }

    // Track mount time
    useEffect(() => {
      mountTimeRef.current = performance.now()
      return () => {
        // Component unmounting - could trace unmount time if needed
      }
    }, [])

    // Render original component
    return <Component {...props} />
  }

  // Set display name for React DevTools
  TracedComponent.displayName = `Traced(${Component.displayName || Component.name || 'Component'})`

  // Memoize to prevent unnecessary re-renders from tracing logic
  return memo(TracedComponent) as FC<P>
}
