/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Position } from '@badaitech/chaingraph-types'
import { NODE_POSITION_DEBOUNCE_MS } from './constants'

// Interpolation modes
export enum InterpolationMode {
  LINEAR = 'LINEAR',
  EASE_OUT = 'EASE_OUT',
}

// Global configuration
export const INTERPOLATION_CONFIG = {
  mode: InterpolationMode.EASE_OUT,
  duration: NODE_POSITION_DEBOUNCE_MS * 3,
}

interface InterpolationState {
  startPosition: Position
  targetPosition: Position
  startTime: number
  duration: number
}

export class PositionInterpolator {
  private interpolationStates: Map<string, InterpolationState> = new Map()
  private animationFrame: number | null = null

  // Start interpolation for a specific node
  addState(nodeId: string, targetPosition: Position, currentPosition: Position) {
    this.interpolationStates.set(nodeId, {
      startPosition: currentPosition,
      targetPosition,
      startTime: performance.now(),
      duration: INTERPOLATION_CONFIG.duration,
    })

    if (!this.animationFrame) {
      this.startAnimation()
    }
  }

  // Calculate interpolated position based on mode
  private interpolate(start: Position, end: Position, progress: number, state: InterpolationState): Position {
    switch (INTERPOLATION_CONFIG.mode) {
      case InterpolationMode.LINEAR:
        return this.linearInterpolate(start, end, progress)

      case InterpolationMode.EASE_OUT:
        return this.easeOutInterpolate(start, end, progress)

      default:
        return this.linearInterpolate(start, end, progress)
    }
  }

  // Linear interpolation
  private linearInterpolate(start: Position, end: Position, progress: number): Position {
    return {
      x: start.x + (end.x - start.x) * progress,
      y: start.y + (end.y - start.y) * progress,
    }
  }

  // Ease out cubic interpolation
  private easeOutInterpolate(start: Position, end: Position, progress: number): Position {
    // Cubic ease out function: progress = 1 - (1 - progress)^3
    const easeProgress = 1 - (1 - progress) ** 3
    return this.linearInterpolate(start, end, easeProgress)
  }

  // Animation loop
  private startAnimation() {
    const animate = (timestamp: number) => {
      let hasActiveInterpolations = false

      this.interpolationStates.forEach((state, nodeId) => {
        // For other modes, use progress based interpolation
        const elapsed = timestamp - state.startTime
        const progress = Math.min(elapsed / state.duration, 1)

        if (progress < 1) {
          hasActiveInterpolations = true
          const position = this.interpolate(
            state.startPosition,
            state.targetPosition,
            progress,
            state,
          )
          this.onUpdate(nodeId, position)
        } else {
          this.interpolationStates.delete(nodeId)
          this.onUpdate(nodeId, state.targetPosition)
        }
      })

      if (hasActiveInterpolations) {
        this.animationFrame = requestAnimationFrame(animate)
      } else {
        this.animationFrame = null
      }
    }

    this.animationFrame = requestAnimationFrame(animate)
  }

  // Cleanup
  dispose() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
    }
    this.interpolationStates.clear()
  }

  // Callback to be set from outside
  onUpdate: (nodeId: string, position: Position) => void = () => {}
}

// Create singleton instance
export const positionInterpolator = new PositionInterpolator()
