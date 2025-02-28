/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import React, { useEffect, useState } from 'react'

export const FPSCounter: React.FC = () => {
  const [fps, setFps] = useState<number>(0)

  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let animationFrameId: number

    const updateFPS = () => {
      frameCount++
      const now = performance.now()
      const delta = now - lastTime

      // Update the FPS every second (or after at least 1000ms has passed)
      if (delta >= 1000) {
        // Calculate frames per second
        const currentFps = (frameCount / delta) * 1000
        setFps(Math.round(currentFps))

        // Reset for the next interval
        frameCount = 0
        lastTime = now
      }

      animationFrameId = requestAnimationFrame(updateFPS)
    }

    // Start the animation loop
    animationFrameId = requestAnimationFrame(updateFPS)

    // Cleanup function to stop the animation frame loop
    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  return (
    <div>
      Current FPS:
      {fps}
    </div>
  )
}
