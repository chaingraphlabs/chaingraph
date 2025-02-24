/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Position } from '@badaitech/chaingraph-types'

interface StateSnapshot {
  position: Position
  timestamp: number
}

export class AdvancedPositionInterpolator {
  private animationFrame: number | null = null
  private stateBuffer: Map<string, StateSnapshot[]> = new Map()
  private springStates: Map<string, {
    velocity: Position
    currentPosition: Position
  }> = new Map()

  // For throttling the update loop to 60 fps.
  private lastUpdateTime: number = 0
  private readonly minFrameTime = 1000 / 60

  // Faster and more precise configuration
  private readonly bufferTime = 1000
  private readonly springConstant = 10.5 // Increased for faster movement
  private readonly dampingFactor = 6.5 // Increased for less oscillation
  private readonly velocityThreshold = 0.2
  private readonly positionThreshold = 2
  private readonly initialMoveSpeed = 8 // Speed for initial linear movement

  addState(
    nodeId: string,
    position: Position,
    currentPosition: Position,
  ) {
    const timestamp = performance.now()
    const buffer = this.stateBuffer.get(nodeId) || []

    // Auto-start animation on first state
    if (this.stateBuffer.size === 0 && buffer.length === 0) {
      this.start()
    }

    // Initialize spring state for new nodes with proper initial position
    if (buffer.length === 0) {
      this.springStates.set(nodeId, {
        velocity: { x: 0, y: 0 },
        // Use current position if provided, otherwise use target position
        currentPosition: currentPosition || position,
      })
    }

    buffer.push({ position, timestamp })

    // Cleanup old states
    const cutoffTime = timestamp - this.bufferTime
    while (buffer.length > 0 && buffer[0].timestamp < cutoffTime) {
      buffer.shift()
    }

    this.stateBuffer.set(nodeId, buffer)
  }

  private springInterpolate(
    current: Position,
    target: Position,
    velocity: Position,
    deltaTime: number,
  ): { position: Position, velocity: Position, finished: boolean } {
    const dx = target.x - current.x
    const dy = target.y - current.y

    // Early return if we're close enough to target
    const isNearTarget = Math.abs(dx) < this.positionThreshold
      && Math.abs(dy) < this.positionThreshold
    const hasLowVelocity = Math.abs(velocity.x) < this.velocityThreshold
      && Math.abs(velocity.y) < this.velocityThreshold

    if (isNearTarget && hasLowVelocity) {
      return {
        position: target,
        velocity: { x: 0, y: 0 },
        finished: true,
      }
    }

    // Enhanced spring physics with faster response
    const ax = (dx * this.springConstant) - (velocity.x * this.dampingFactor)
    const ay = (dy * this.springConstant) - (velocity.y * this.dampingFactor)

    const newVelocity = {
      x: velocity.x + ax * deltaTime,
      y: velocity.y + ay * deltaTime,
    }

    const newPosition = {
      x: current.x + newVelocity.x * deltaTime,
      y: current.y + newVelocity.y * deltaTime,
    }

    return {
      position: newPosition,
      velocity: newVelocity,
      finished: false,
    }
  }

  private animate = (timestamp: number) => {
    if (timestamp - this.lastUpdateTime < this.minFrameTime) {
      // Throttle: If minimal frame time hasn't elapsed, schedule next frame without update.
      this.animationFrame = requestAnimationFrame(this.animate)
      return
    }
    this.lastUpdateTime = timestamp

    // Array to keep track of nodes whose interpolation is finished.
    const finishedNodes: string[] = []

    this.stateBuffer.forEach((buffer, nodeId) => {
      if (buffer.length === 0)
        return

      const springState = this.springStates.get(nodeId)!
      const targetPosition = buffer[buffer.length - 1].position

      // Use spring interpolation for subsequent movements
      const deltaTime = 1 / 30
      const { position, velocity, finished } = this.springInterpolate(
        springState.currentPosition,
        targetPosition,
        springState.velocity,
        deltaTime,
      )

      if (finished) {
        // Notify final position once, then mark this node for removal.
        this.onUpdate(nodeId, targetPosition)
        finishedNodes.push(nodeId)
      } else {
        springState.currentPosition = position
        springState.velocity = velocity
        this.onUpdate(nodeId, position)
      }
    })

    // Clean up finished node states.
    finishedNodes.forEach((nodeId) => {
      this.stateBuffer.delete(nodeId)
      this.springStates.delete(nodeId)
    })

    // Continue animation only if there is at least one active node.
    if (this.stateBuffer.size > 0) {
      this.animationFrame = requestAnimationFrame(this.animate)
    } else {
      this.animationFrame = null
    }
  }

  start() {
    if (!this.animationFrame) {
      console.log('Starting position interpolator')
      this.lastUpdateTime = performance.now()
      this.animationFrame = requestAnimationFrame(this.animate)
    }
  }

  dispose() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
    this.stateBuffer.clear()
    this.springStates.clear()
  }

  clearNodeState(nodeId: string) {
    this.stateBuffer.delete(nodeId)
    this.springStates.delete(nodeId)
  }

  onUpdate: (nodeId: string, position: Position) => void = () => {}
}

export const positionInterpolator = new AdvancedPositionInterpolator()
