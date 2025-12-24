/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EdgeAnchor } from '@badaitech/chaingraph-types'
import { Position } from '@xyflow/react'
import { $curveConfig, type CurveConfig } from '@/store/settings/curve-config'

interface Point {
  x: number
  y: number
}

/**
 * Get current curve configuration from the store
 * This allows real-time updates from the Settings panel
 */
function getConfig(): CurveConfig {
  return $curveConfig.getState()
}

/**
 * Calculate adaptive virtual anchor offset based on distance to next point
 * Shorter edges get smaller offset to prevent overshooting
 *
 * Formula: effectiveOffset = maxOffset * min(1, (distance / refDistance)^power)
 *
 * @param fromPoint - Starting point (source or last anchor)
 * @param toPoint - Next point (first anchor or target)
 */
function calculateAdaptiveOffset(fromPoint: Point, toPoint: Point): number {
  const config = getConfig()
  const { virtualAnchorMaxOffset, virtualAnchorRefDistance, virtualAnchorPower } = config

  // Calculate Euclidean distance to next point (XY distance, not just X)
  const dx = toPoint.x - fromPoint.x
  const dy = toPoint.y - fromPoint.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  // Apply scaling formula: smaller distance = smaller offset
  // When distance < refDistance, offset scales down proportionally
  const scale = Math.min(1, (distance / virtualAnchorRefDistance) ** virtualAnchorPower)

  return virtualAnchorMaxOffset * scale
}

/**
 * Compute parameter values for non-uniform Catmull-Rom
 * Uses distance-based parameterization to prevent cusps
 *
 * @param points - Array of control points
 * @param alpha - Parameterization: 0=uniform, 0.5=centripetal, 1.0=chordal
 */
function computeParameterValues(points: Point[], alpha: number): number[] {
  const t = [0]
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x
    const dy = points[i].y - points[i - 1].y
    const dist = Math.sqrt(dx * dx + dy * dy)
    // For uniform (alpha=0), dist^0 = 1, so t increments by 1
    // For centripetal (alpha=0.5), t increments by sqrt(dist)
    // For chordal (alpha=1.0), t increments by dist
    const increment = alpha === 0 ? 1 : Math.max(dist, 0.001) ** alpha
    t.push(t[i - 1] + increment)
  }
  return t
}

/**
 * Calculate virtual anchor near source handle based on handle position
 * Creates natural S-curve that respects handle direction
 *
 * Virtual anchor is placed OPPOSITE to handle direction for correct tangent
 *
 * @param source - Source point
 * @param position - Handle position (right, left, top, bottom)
 * @param nextPoint - First anchor or target (for adaptive offset calculation)
 */
function getVirtualSourceAnchor(
  source: Point,
  position: Position,
  nextPoint: Point,
): Point {
  const offset = calculateAdaptiveOffset(source, nextPoint)

  // Virtual anchor goes OPPOSITE to handle direction
  switch (position) {
    case 'right':
      return { x: source.x - offset, y: source.y } // Handle points right → anchor goes left
    case 'left':
      return { x: source.x + offset, y: source.y } // Handle points left → anchor goes right
    case 'bottom':
      return { x: source.x, y: source.y - offset } // Handle points down → anchor goes up
    case 'top':
      return { x: source.x, y: source.y + offset } // Handle points up → anchor goes down
    default:
      return { x: source.x - offset, y: source.y }
  }
}

/**
 * Calculate virtual anchor near target handle based on handle position
 * Creates natural S-curve that respects handle direction
 *
 * Virtual anchor is placed OPPOSITE to handle direction for correct tangent
 *
 * @param target - Target point
 * @param position - Handle position (right, left, top, bottom)
 * @param prevPoint - Last anchor or source (for adaptive offset calculation)
 */
function getVirtualTargetAnchor(
  target: Point,
  position: Position,
  prevPoint: Point,
): Point {
  const offset = calculateAdaptiveOffset(prevPoint, target)

  // Virtual anchor goes OPPOSITE to handle direction
  switch (position) {
    case 'right':
      return { x: target.x - offset, y: target.y } // Handle points right → anchor goes left
    case 'left':
      return { x: target.x + offset, y: target.y } // Handle points left → anchor goes right
    case 'bottom':
      return { x: target.x, y: target.y - offset } // Handle points down → anchor goes up
    case 'top':
      return { x: target.x, y: target.y + offset } // Handle points up → anchor goes down
    default:
      return { x: target.x + offset, y: target.y }
  }
}

/**
 * Generate smooth Bezier chain through all points
 * Uses cubic Hermite spline with automatic tangent calculation
 * Produces C1 continuous curves (smooth tangents at all junctions)
 *
 * @param points - Full points array including virtual anchors
 * @param config - Curve configuration (uses curvature parameter)
 */
function generateBezierChain(points: Point[], config: CurveConfig): string {
  // Start at source (index 1)
  let path = `M ${points[1].x} ${points[1].y}`

  // Generate one cubic Bezier segment between each consecutive pair
  for (let i = 1; i < points.length - 2; i++) {
    const p0 = points[Math.max(0, i - 1)]  // Previous point (for tangent calculation)
    const p1 = points[i]                    // Current segment start
    const p2 = points[i + 1]                // Current segment end
    const p3 = points[Math.min(points.length - 1, i + 2)]  // Next point (for tangent)

    // Calculate tangent at p1 using Catmull-Rom formula: (p2 - p0) / 2
    const t1x = (p2.x - p0.x) / 2
    const t1y = (p2.y - p0.y) / 2

    // Calculate tangent at p2
    const t2x = (p3.x - p1.x) / 2
    const t2y = (p3.y - p1.y) / 2

    // Control points based on tangents and curvature parameter
    const cp1 = {
      x: p1.x + t1x * config.curvature,
      y: p1.y + t1y * config.curvature,
    }
    const cp2 = {
      x: p2.x - t2x * config.curvature,
      y: p2.y - t2y * config.curvature,
    }

    path += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`
  }

  return path
}

/**
 * Sample a point on the Bezier chain at parameter t
 * Uses same Hermite tangent calculation as generateBezierChain
 *
 * @param points - Full points array including virtual anchors
 * @param t - Parameter from 0 (source) to 1 (target)
 * @param config - Curve configuration (uses curvature)
 */
function getPointOnBezierChain(points: Point[], t: number, config: CurveConfig): Point {
  const numSegments = points.length - 3 // source to target
  const segmentT = t * numSegments
  const segmentIndex = Math.min(Math.floor(segmentT), numSegments - 1) + 1 // +1 to skip virtualSource
  const localT = segmentT - Math.floor(segmentT)

  // Get 4 points for Hermite tangent calculation
  const p0 = points[Math.max(0, segmentIndex - 1)]
  const p1 = points[segmentIndex]
  const p2 = points[segmentIndex + 1]
  const p3 = points[Math.min(points.length - 1, segmentIndex + 2)]

  // Calculate tangents (same as generateBezierChain)
  const t1x = (p2.x - p0.x) / 2
  const t1y = (p2.y - p0.y) / 2
  const t2x = (p3.x - p1.x) / 2
  const t2y = (p3.y - p1.y) / 2

  // Control points
  const cp1x = p1.x + t1x * config.curvature
  const cp1y = p1.y + t1y * config.curvature
  const cp2x = p2.x - t2x * config.curvature
  const cp2y = p2.y - t2y * config.curvature

  // Sample cubic Bezier at localT using standard formula
  const t_inv = 1 - localT
  const t_inv2 = t_inv * t_inv
  const t_inv3 = t_inv2 * t_inv
  const t2 = localT * localT
  const t3 = t2 * localT

  return {
    x: t_inv3 * p1.x + 3 * t_inv2 * localT * cp1x + 3 * t_inv * t2 * cp2x + t3 * p2.x,
    y: t_inv3 * p1.y + 3 * t_inv2 * localT * cp1y + 3 * t_inv * t2 * cp2y + t3 * p2.y,
  }
}

/**
 * Sample a point on the step (orthogonal) path at parameter t
 *
 * @param source - Source point
 * @param target - Target point
 * @param anchors - User anchors
 * @param t - Parameter from 0 to 1
 * @param sourcePosition - Source handle position
 * @param targetPosition - Target handle position
 * @param config - Curve configuration
 */
function getPointOnStepPath(
  source: Point,
  target: Point,
  anchors: EdgeAnchor[],
  t: number,
  sourcePosition: Position,
  targetPosition: Position,
  config: CurveConfig,
): Point {
  const allPoints = [source, ...anchors, target]

  // Calculate total path length (approximate - sum of orthogonal segments)
  let totalLength = 0
  const segmentLengths: number[] = []

  for (let i = 0; i < allPoints.length - 1; i++) {
    const from = allPoints[i]
    const to = allPoints[i + 1]

    // Orthogonal distance: |dx| + |dy|
    const segLength = Math.abs(to.x - from.x) + Math.abs(to.y - from.y)
    segmentLengths.push(segLength)
    totalLength += segLength
  }

  // Find which segment t falls into
  const targetLength = t * totalLength
  let accumulatedLength = 0

  for (let i = 0; i < segmentLengths.length; i++) {
    const segEnd = accumulatedLength + segmentLengths[i]

    if (targetLength <= segEnd) {
      // t falls in this segment
      const segT = (targetLength - accumulatedLength) / segmentLengths[i]
      const from = allPoints[i]
      const to = allPoints[i + 1]

      // Simple midpoint interpolation for step path
      const dx = to.x - from.x
      const dy = to.y - from.y

      // For orthogonal routing, go horizontal then vertical (or vice versa)
      if (Math.abs(dx) > Math.abs(dy)) {
        const midX = from.x + dx / 2
        if (segT < 0.5) {
          // On horizontal segment
          return { x: from.x + dx * segT * 2, y: from.y }
        } else {
          // On vertical segment
          return { x: midX, y: from.y + dy * (segT - 0.5) * 2 }
        }
      } else {
        const midY = from.y + dy / 2
        if (segT < 0.5) {
          // On vertical segment
          return { x: from.x, y: from.y + dy * segT * 2 }
        } else {
          // On horizontal segment
          return { x: from.x + dx * (segT - 0.5) * 2, y: midY }
        }
      }
    }

    accumulatedLength = segEnd
  }

  // Fallback: return target
  return target
}

/**
 * Interpolate a point on the curve using Barry-Goldman algorithm
 * This is an internal helper that works with pre-built points array
 *
 * @param points - Full points array including virtual anchors
 * @param params - Pre-computed parameter values
 * @param t - Parameter from 0 (source) to 1 (target)
 */
function interpolatePoint(points: Point[], params: number[], t: number): Point {
  const numVisibleSegments = points.length - 3
  const segmentT = t * numVisibleSegments
  const segmentIndex = Math.min(Math.floor(segmentT), numVisibleSegments - 1) + 1
  const localT = segmentT - Math.floor(segmentT)

  const p0 = points[Math.max(0, segmentIndex - 1)]
  const p1 = points[segmentIndex]
  const p2 = points[segmentIndex + 1]
  const p3 = points[Math.min(points.length - 1, segmentIndex + 2)]

  const i = segmentIndex
  const dt0 = params[i] - params[i - 1]
  const dt1 = params[i + 1] - params[i]
  const dt2 = params[Math.min(params.length - 1, i + 2)] - params[i + 1]

  const t0 = 0
  const t1 = dt0
  const t2 = t1 + dt1
  const t3 = t2 + dt2
  const u = t1 + localT * dt1

  // Barry-Goldman recursive formula for non-uniform Catmull-Rom
  const A1x = (t1 - u) / Math.max(t1 - t0, 0.001) * p0.x + (u - t0) / Math.max(t1 - t0, 0.001) * p1.x
  const A1y = (t1 - u) / Math.max(t1 - t0, 0.001) * p0.y + (u - t0) / Math.max(t1 - t0, 0.001) * p1.y
  const A2x = (t2 - u) / Math.max(t2 - t1, 0.001) * p1.x + (u - t1) / Math.max(t2 - t1, 0.001) * p2.x
  const A2y = (t2 - u) / Math.max(t2 - t1, 0.001) * p1.y + (u - t1) / Math.max(t2 - t1, 0.001) * p2.y
  const A3x = (t3 - u) / Math.max(t3 - t2, 0.001) * p2.x + (u - t2) / Math.max(t3 - t2, 0.001) * p3.x
  const A3y = (t3 - u) / Math.max(t3 - t2, 0.001) * p2.y + (u - t2) / Math.max(t3 - t2, 0.001) * p3.y

  const B1x = (t2 - u) / Math.max(t2 - t0, 0.001) * A1x + (u - t0) / Math.max(t2 - t0, 0.001) * A2x
  const B1y = (t2 - u) / Math.max(t2 - t0, 0.001) * A1y + (u - t0) / Math.max(t2 - t0, 0.001) * A2y
  const B2x = (t3 - u) / Math.max(t3 - t1, 0.001) * A2x + (u - t1) / Math.max(t3 - t1, 0.001) * A3x
  const B2y = (t3 - u) / Math.max(t3 - t1, 0.001) * A2y + (u - t1) / Math.max(t3 - t1, 0.001) * A3y

  const Cx = (t2 - u) / Math.max(t2 - t1, 0.001) * B1x + (u - t1) / Math.max(t2 - t1, 0.001) * B2x
  const Cy = (t2 - u) / Math.max(t2 - t1, 0.001) * B1y + (u - t1) / Math.max(t2 - t1, 0.001) * B2y

  return { x: Cx, y: Cy }
}

/**
 * Generate orthogonal step path with rounded corners
 * Routes through anchors using only horizontal/vertical lines
 *
 * @param source - Source point
 * @param target - Target point
 * @param anchors - User-placed anchors as waypoints
 * @param sourcePosition - Source handle position
 * @param targetPosition - Target handle position
 * @param config - Curve configuration (uses borderRadius)
 */
function generateStepPath(
  source: Point,
  target: Point,
  anchors: EdgeAnchor[],
  sourcePosition: Position,
  targetPosition: Position,
  config: CurveConfig,
): string {
  const allPoints = [source, ...anchors, target]
  const { borderRadius } = config

  let path = `M ${source.x} ${source.y}`

  for (let i = 0; i < allPoints.length - 1; i++) {
    const from = allPoints[i]
    const to = allPoints[i + 1]

    // Determine if this is first/last segment (has explicit position)
    const isFirst = i === 0
    const isLast = i === allPoints.length - 2

    // Simple orthogonal routing: go horizontal then vertical (or vice versa)
    const dx = to.x - from.x
    const dy = to.y - from.y

    // Choose routing based on handle positions
    let midPoint: Point

    if (isFirst && sourcePosition === 'right') {
      // Exit right: go horizontal first
      midPoint = { x: from.x + Math.abs(dx) / 2, y: from.y }
    }
    else if (isFirst && sourcePosition === 'left') {
      // Exit left: go horizontal first
      midPoint = { x: from.x - Math.abs(dx) / 2, y: from.y }
    }
    else if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal-first routing for anchors
      midPoint = { x: from.x + dx / 2, y: from.y }
    }
    else {
      // Vertical-first routing
      midPoint = { x: from.x, y: from.y + dy / 2 }
    }

    // Add first segment (from → midPoint)
    const seg1Length = Math.sqrt((midPoint.x - from.x) ** 2 + (midPoint.y - from.y) ** 2)
    const seg2Length = Math.sqrt((to.x - midPoint.x) ** 2 + (to.y - midPoint.y) ** 2)

    if (seg1Length > borderRadius * 2 && seg2Length > borderRadius * 2) {
      // Calculate bend points for rounded corner
      const radius = borderRadius

      // Point before corner on first segment
      const bendStart = {
        x: midPoint.x === from.x ? midPoint.x : (midPoint.x > from.x ? midPoint.x - radius : midPoint.x + radius),
        y: midPoint.y === from.y ? midPoint.y : (midPoint.y > from.y ? midPoint.y - radius : midPoint.y + radius),
      }

      // Point after corner on second segment
      const bendEnd = {
        x: midPoint.x === to.x ? midPoint.x : (to.x > midPoint.x ? midPoint.x + radius : midPoint.x - radius),
        y: midPoint.y === to.y ? midPoint.y : (to.y > midPoint.y ? midPoint.y + radius : midPoint.y - radius),
      }

      path += ` L ${bendStart.x} ${bendStart.y}`
      path += ` Q ${midPoint.x} ${midPoint.y}, ${bendEnd.x} ${bendEnd.y}`
      path += ` L ${to.x} ${to.y}`
    }
    else {
      // Segments too short for rounded corners, use straight lines
      path += ` L ${midPoint.x} ${midPoint.y}`
      path += ` L ${to.x} ${to.y}`
    }
  }

  return path
}

/**
 * Generate exact Catmull-Rom curve as polyline using Barry-Goldman algorithm
 * This produces perfectly smooth curves with no approximation artifacts
 *
 * @param points - Full points array including virtual anchors
 * @param config - Curve configuration (uses alpha and smoothness)
 */
function generatePolylinePath(points: Point[], config: CurveConfig): string {
  const params = computeParameterValues(points, config.alpha)
  const numSegments = points.length - 3 // source to target
  const pointsPerSegment = config.smoothness
  const totalPoints = numSegments * pointsPerSegment

  // Start at source (index 1)
  let path = `M ${points[1].x} ${points[1].y}`

  // Generate exact interpolated points up to (but not including) target
  for (let i = 1; i < totalPoints; i++) {
    const t = i / totalPoints
    const point = interpolatePoint(points, params, t)
    path += ` L ${point.x} ${point.y}`
  }

  // Explicitly end at target (prevents loop caused by virtualTarget in interpolation)
  const targetIndex = points.length - 2
  path += ` L ${points[targetIndex].x} ${points[targetIndex].y}`

  return path
}

/**
 * Generate approximate Catmull-Rom curve as Bezier curves
 * Compact SVG but may have subtle discontinuities at anchor points
 *
 * @param points - Full points array including virtual anchors
 * @param params - Pre-computed parameter values
 * @param config - Curve configuration (uses tension)
 */
function generateBezierPath(points: Point[], params: number[], config: CurveConfig): string {
  // Start at source (index 1)
  let path = `M ${points[1].x} ${points[1].y}`

  // Generate cubic bezier segments from source to target (skip virtual endpoints)
  for (let i = 1; i < points.length - 2; i++) {
    const p0 = points[i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]

    // Parameter differences for this segment
    const dt0 = params[i] - params[i - 1]
    const dt1 = params[i + 1] - params[i]
    const dt2 = params[i + 2] - params[i + 1]

    // Calculate Bezier control points using non-uniform Catmull-Rom formula
    const { tension } = config

    // Handle edge case where dt values might be very small
    const w1 = dt1 / Math.max(dt0 + dt1, 0.001)
    const w2 = dt1 / Math.max(dt1 + dt2, 0.001)

    const cp1 = {
      x: p1.x + (w1 * (p2.x - p0.x) * tension) / 3,
      y: p1.y + (w1 * (p2.y - p0.y) * tension) / 3,
    }
    const cp2 = {
      x: p2.x - (w2 * (p3.x - p1.x) * tension) / 3,
      y: p2.y - (w2 * (p3.y - p1.y) * tension) / 3,
    }

    path += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`
  }

  return path
}

/**
 * Convert edge path to SVG based on selected rendering mode
 *
 * Supports four rendering modes:
 * - 'bezier-chain': Smooth cubic Bezier chain with C1 continuity (recommended)
 * - 'step': Orthogonal routing with rounded corners
 * - 'catmull-rom-polyline': Exact Barry-Goldman interpolation (may wobble)
 * - 'catmull-rom-bezier': Cubic Bezier approximation (may have kinks)
 *
 * @param sourcePosition - Source handle position
 * @param targetPosition - Target handle position
 */
export function catmullRomToBezierPath(
  source: Point,
  target: Point,
  anchors: EdgeAnchor[],
  sourcePosition: Position = Position.Right,
  targetPosition: Position = Position.Left,
): string {
  const config = getConfig()

  // Step mode doesn't use virtual anchors
  if (config.renderMode === 'step') {
    return generateStepPath(source, target, anchors, sourcePosition, targetPosition, config)
  }

  // All curved modes use virtual anchors for natural S-curve
  const nextPointFromSource = anchors.length > 0 ? anchors[0] : target
  const prevPointFromTarget = anchors.length > 0 ? anchors[anchors.length - 1] : source

  const virtualSource = getVirtualSourceAnchor(source, sourcePosition, nextPointFromSource)
  const virtualTarget = getVirtualTargetAnchor(target, targetPosition, prevPointFromTarget)

  // Build points array: [virtual_source, source, ...user_anchors, target, virtual_target]
  const points: Point[] = [
    virtualSource,
    source,
    ...anchors,
    target,
    virtualTarget,
  ]

  // Choose rendering mode
  switch (config.renderMode) {
    case 'bezier-chain':
      return generateBezierChain(points, config)

    case 'catmull-rom-polyline': {
      return generatePolylinePath(points, config)
    }

    case 'catmull-rom-bezier': {
      const params = computeParameterValues(points, config.alpha)
      return generateBezierPath(points, params, config)
    }

    default:
      // Fallback to bezier-chain
      return generateBezierChain(points, config)
  }
}

/**
 * Calculate ghost anchor positions - actual points ON the curve at segment midpoints
 *
 * Ghosts appear between real points (source, user anchors, target).
 * Virtual anchors are NOT included in ghost calculation.
 */
export function calculateGhostAnchors(
  source: Point,
  target: Point,
  anchors: EdgeAnchor[],
  sourcePosition: Position = Position.Right,
  targetPosition: Position = Position.Left,
): Array<{ x: number, y: number, insertIndex: number }> {
  const config = getConfig()
  const realPoints: Point[] = [source, ...anchors, target]
  const ghosts: Array<{ x: number, y: number, insertIndex: number }> = []
  const numSegments = realPoints.length - 1

  for (let i = 0; i < numSegments; i++) {
    // Calculate t value for the midpoint of this segment
    const segmentMidT = (i + 0.5) / numSegments
    let pointOnCurve: Point

    // Use same algorithm as current render mode for accurate ghost positioning
    switch (config.renderMode) {
      case 'bezier-chain': {
        // Build virtual anchors for Bezier chain
        const nextPointFromSource = anchors.length > 0 ? anchors[0] : target
        const prevPointFromTarget = anchors.length > 0 ? anchors[anchors.length - 1] : source
        const virtualSource = getVirtualSourceAnchor(source, sourcePosition, nextPointFromSource)
        const virtualTarget = getVirtualTargetAnchor(target, targetPosition, prevPointFromTarget)

        const points = [virtualSource, source, ...anchors, target, virtualTarget]
        pointOnCurve = getPointOnBezierChain(points, segmentMidT, config)
        break
      }

      case 'step':
        pointOnCurve = getPointOnStepPath(source, target, anchors, segmentMidT, sourcePosition, targetPosition, config)
        break

      case 'catmull-rom-polyline':
      case 'catmull-rom-bezier':
      default:
        // Use Barry-Goldman (existing implementation)
        pointOnCurve = getPointOnCurve(source, target, anchors, segmentMidT, sourcePosition, targetPosition)
        break
    }

    ghosts.push({
      x: pointOnCurve.x,
      y: pointOnCurve.y,
      insertIndex: i,
    })
  }

  return ghosts
}

/**
 * Get a point at parameter t (0-1) along the curve
 *
 * Uses same parameterization as catmullRomToBezierPath for consistency.
 *
 * @param t - Parameter from 0 (source) to 1 (target)
 */
export function getPointOnCurve(
  source: Point,
  target: Point,
  anchors: EdgeAnchor[],
  t: number,
  sourcePosition: Position = Position.Right,
  targetPosition: Position = Position.Left,
): Point {
  const config = getConfig()

  // Determine next/prev points for adaptive offset
  const nextPointFromSource = anchors.length > 0 ? anchors[0] : target
  const prevPointFromTarget = anchors.length > 0 ? anchors[anchors.length - 1] : source

  // Build points array with virtual anchors
  const virtualSource = getVirtualSourceAnchor(source, sourcePosition, nextPointFromSource)
  const virtualTarget = getVirtualTargetAnchor(target, targetPosition, prevPointFromTarget)

  const points: Point[] = [
    virtualSource,
    source,
    ...anchors,
    target,
    virtualTarget,
  ]

  // Compute parameter values for consistent behavior with path generation
  const params = computeParameterValues(points, config.alpha)

  // Curve goes from source (index 1) to target (index points.length - 2)
  const numVisibleSegments = points.length - 3

  // Map t to the parameter space
  const segmentT = t * numVisibleSegments
  const segmentIndex = Math.min(Math.floor(segmentT), numVisibleSegments - 1) + 1
  const localT = segmentT - Math.floor(segmentT)

  const p0 = points[Math.max(0, segmentIndex - 1)]
  const p1 = points[segmentIndex]
  const p2 = points[segmentIndex + 1]
  const p3 = points[Math.min(points.length - 1, segmentIndex + 2)]

  // Get parameter differences for this segment
  const i = segmentIndex
  const dt0 = params[i] - params[i - 1]
  const dt1 = params[i + 1] - params[i]
  const dt2 = params[Math.min(params.length - 1, i + 2)] - params[i + 1]

  // For non-uniform Catmull-Rom, we need to use the Barry-Goldman algorithm
  // which properly handles varying parameter intervals
  const t0 = 0
  const t1 = dt0
  const t2 = t1 + dt1
  const t3 = t2 + dt2

  // Map localT to this segment's parameter range
  const u = t1 + localT * dt1

  // Barry-Goldman recursive formula for non-uniform Catmull-Rom
  const A1x = (t1 - u) / Math.max(t1 - t0, 0.001) * p0.x + (u - t0) / Math.max(t1 - t0, 0.001) * p1.x
  const A1y = (t1 - u) / Math.max(t1 - t0, 0.001) * p0.y + (u - t0) / Math.max(t1 - t0, 0.001) * p1.y
  const A2x = (t2 - u) / Math.max(t2 - t1, 0.001) * p1.x + (u - t1) / Math.max(t2 - t1, 0.001) * p2.x
  const A2y = (t2 - u) / Math.max(t2 - t1, 0.001) * p1.y + (u - t1) / Math.max(t2 - t1, 0.001) * p2.y
  const A3x = (t3 - u) / Math.max(t3 - t2, 0.001) * p2.x + (u - t2) / Math.max(t3 - t2, 0.001) * p3.x
  const A3y = (t3 - u) / Math.max(t3 - t2, 0.001) * p2.y + (u - t2) / Math.max(t3 - t2, 0.001) * p3.y

  const B1x = (t2 - u) / Math.max(t2 - t0, 0.001) * A1x + (u - t0) / Math.max(t2 - t0, 0.001) * A2x
  const B1y = (t2 - u) / Math.max(t2 - t0, 0.001) * A1y + (u - t0) / Math.max(t2 - t0, 0.001) * A2y
  const B2x = (t3 - u) / Math.max(t3 - t1, 0.001) * A2x + (u - t1) / Math.max(t3 - t1, 0.001) * A3x
  const B2y = (t3 - u) / Math.max(t3 - t1, 0.001) * A2y + (u - t1) / Math.max(t3 - t1, 0.001) * A3y

  const Cx = (t2 - u) / Math.max(t2 - t1, 0.001) * B1x + (u - t1) / Math.max(t2 - t1, 0.001) * B2x
  const Cy = (t2 - u) / Math.max(t2 - t1, 0.001) * B1y + (u - t1) / Math.max(t2 - t1, 0.001) * B2y

  return { x: Cx, y: Cy }
}
