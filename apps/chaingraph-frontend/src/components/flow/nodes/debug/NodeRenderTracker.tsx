/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useEffect, useRef } from 'react'

interface NodeRenderTrackerProps {
  nodeId: string
  shouldShowLogs?: boolean
}

/**
 * Component to track and log node render cycles.
 * Add this to your ChaingraphNodeComponent to debug when nodes re-render.
 */
export function NodeRenderTracker({ nodeId, shouldShowLogs = false }: NodeRenderTrackerProps) {
  const renderCount = useRef(0)

  useEffect(() => {
    renderCount.current += 1

    if (shouldShowLogs) {
      console.log(`[RenderTracker] Node ${nodeId} rendered (${renderCount.current} times)`)
    }

    // Return cleanup to track component unmounts
    return () => {
      if (shouldShowLogs) {
        console.log(`[RenderTracker] Node ${nodeId} unmounted after ${renderCount.current} renders`)
      }
    }
  })

  return (
    <div
      style={{
        position: 'absolute',
        // top: 0,
        // left: 0,
        marginTop: -20,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      {/* Optional debug overlay */}
      <div
        style={{
          position: 'relative',
          // top: 0,
          // left: 0,
          padding: '4px',
          fontSize: '12px',
        }}
      >
        Render Count:
        {' '}
        {renderCount.current}
      </div>
    </div>
  )
}
