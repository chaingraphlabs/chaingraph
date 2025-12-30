/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EdgeProps } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { motion } from 'framer-motion'
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from '@/components/theme/hooks/useTheme'
import { calculateNodeDepth, getAbsoluteNodePosition } from '@/store/edges/anchor-coordinates'
import { addAnchorNode } from '@/store/edges/anchor-nodes'
import { useAnchorNodePositions } from '@/store/edges/hooks/useAnchorNodePositions'
import { $selectedEdgeId } from '@/store/edges/selection'
import { $groupNodes, $nodePositionData } from '@/store/nodes/derived-stores'
import { $curveConfig } from '@/store/settings/curve-config'
import { calculateGhostAnchors, catmullRomToBezierPath } from './utils/catmull-rom'

// Static store to maintain particle positions across component remounts
// Using a Map with edge IDs as keys to maintain separate positions for each edge
const globalParticleStore = new Map<string, {
  progress: number[]
  positions: Array<{ x: number, y: number }>
  lastUpdateTime: number
}>()

// Helper function to create a lighter version of a color
function getLighterColor(stroke: string): string {
  return stroke !== 'currentColor' ? `${stroke}99` : 'rgba(currentColor, 0.6)'
}

/**
 * Optimized particle effect component that handles animations with reduced re-renders
 * and preserves animation state across updates
 */
const ParticleEffect = memo(({
  edgeId,
  pathRef,
  pathLength,
  stroke,
  strokeWidth,
}: {
  edgeId: string
  pathRef: React.RefObject<SVGPathElement>
  pathLength: number
  stroke: string
  strokeWidth: number
}) => {
  const { theme } = useTheme()

  // Pre-calculate particle data to avoid unnecessary state updates
  const particleCount = 4
  const particleSizes = [strokeWidth * 1.2, strokeWidth * 0.6, strokeWidth * 0.6, strokeWidth * 0.6]
  const particleColors
    = theme === 'dark'
      ? [stroke, 'white', 'white', 'white']
      : [stroke, '#38a169', '#4fd1c5', '#25855a']
  const particleOpacities = [0.8, 0.7, 0.7, 0.7]

  // Use forceUpdate pattern to minimize re-renders
  const [, forceUpdate] = useState({})

  // First, create the initial state outside of useRef
  const initialParticleState = (() => {
    // Try to get positions from global store
    if (globalParticleStore.has(edgeId)) {
      return {
        progress: [...globalParticleStore.get(edgeId)!.progress],
        positions: [...globalParticleStore.get(edgeId)!.positions],
      }
    }

    // Otherwise initialize with default values
    return {
      progress: [0, 0.25, 0.5, 0.75],
      positions: Array.from({ length: particleCount }).fill(0).map(() => ({ x: 0, y: 0 })),
    }
  })()

  // Then use the value directly in useRef
  const particlesRef = useRef<{
    progress: number[]
    positions: Array<{ x: number, y: number }>
  }>(initialParticleState)

  // Animation effect for particles that preserves state across remounts
  useEffect(() => {
    if (!pathRef.current || pathLength <= 0)
      return

    // Get the current time for animation speed adjustment
    const now = performance.now()

    // If we have this edge in the store, calculate time elapsed since last update
    // and adjust progress values accordingly
    if (globalParticleStore.has(edgeId)) {
      const stored = globalParticleStore.get(edgeId)!
      const timeDiff = now - stored.lastUpdateTime

      // Only update if enough time has passed (prevents position jumps)
      if (timeDiff > 16) { // 16ms = approx one frame
        const speeds = [0.005, 0.003, 0.003, 0.003]
        // const timeRatio = timeDiff / 16
        const timeRatio = timeDiff / 16

        // Update progress based on elapsed time
        particlesRef.current.progress = stored.progress.map((p, i) =>
          (p + (speeds[i] * timeRatio)) % 1,
        )
      } else {
        // Use existing progress
        particlesRef.current.progress = [...stored.progress]
      }

      // Use existing positions as starting point
      particlesRef.current.positions = [...stored.positions]
    }

    // Initialize animation variables
    let animationFrameId: number
    const speeds = [0.005, 0.003, 0.003, 0.003] // Different speeds for each particle
    const rafInterval = 3 // Only update animation every X frames to reduce CPU usage
    let frameCount = 0
    let isActive = true // Flag to check if the component is still mounted

    const animateParticles = () => {
      if (!isActive)
        return

      frameCount = (frameCount + 1) % rafInterval

      if (frameCount === 0 && pathRef.current) {
        // Update progress values
        particlesRef.current.progress = particlesRef.current.progress.map((p, i) =>
          (p + speeds[i]) % 1,
        )

        // Update particle positions based on progress along the path
        for (let i = 0; i < particleCount; i++) {
          const point = pathRef.current.getPointAtLength(
            particlesRef.current.progress[i] * pathLength,
          )
          particlesRef.current.positions[i] = { x: point.x, y: point.y }
        }

        // Update global store with current values
        globalParticleStore.set(edgeId, {
          progress: [...particlesRef.current.progress],
          positions: [...particlesRef.current.positions],
          lastUpdateTime: performance.now(),
        })

        // Trigger a single re-render for all particles
        forceUpdate({})
      }

      animationFrameId = requestAnimationFrame(animateParticles)
    }

    animateParticles()

    return () => {
      isActive = false
      cancelAnimationFrame(animationFrameId)

      // Update the global store one last time on unmount
      if (particlesRef.current.positions[0].x !== 0 || particlesRef.current.positions[0].y !== 0) {
        globalParticleStore.set(edgeId, {
          progress: [...particlesRef.current.progress],
          positions: [...particlesRef.current.positions],
          lastUpdateTime: performance.now(),
        })
      }
    }
  }, [edgeId, pathRef, pathLength])

  // Render particles directly from our ref without depending on state changes
  return (
    <>
      {particlesRef.current.positions.map((particle, i) => (
        <motion.circle
          key={`${edgeId}-particle-${i}`}
          cx={particle.x}
          cy={particle.y}
          r={particleSizes[i]}
          fill={particleColors[i]}
          opacity={particleOpacities[i]}
          // Use direct animation values to make them deterministic
          // but don't animate the position (cx/cy) which we already control manually
          animate={{
            opacity: i === 0 ? [0.8, 1, 0.8] : [0.4, 0.8, 0.4],
            scale: i === 0 ? [1, 1.2, 1] : [0.8, 1, 0.8],
          }}
          transition={{
            duration: i === 0 ? 1.2 : 0.8,
            ease: 'easeInOut',
            repeat: Infinity,
            delay: i * 0.3,
          }}
        />
      ))}
    </>
  )
})

ParticleEffect.displayName = 'ParticleEffect'

/**
 * Optimized FlowEdge component with distinctive Chaingraph styling
 * Uses memoization and minimizes calculations for better performance
 */
export const FlowEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) => {
  // Extract style properties with fallbacks
  const {
    stroke = 'currentColor',
    strokeWidth = 2,
    strokeOpacity = 1,
  } = style as { stroke: string, strokeWidth: number, strokeOpacity: number }

  const { theme } = useTheme()

  // Anchor support
  const selectedEdgeId = useUnit($selectedEdgeId)
  const curveConfig = useUnit($curveConfig)
  const groupNodes = useUnit($groupNodes)
  const nodePositionData = useUnit($nodePositionData)
  const isSelected = selectedEdgeId === id
  const edgeId = (data as any)?.edgeData?.edgeId ?? id

  // Hover state for visual feedback
  const [isHovered, setIsHovered] = useState(false)

  // Get anchor positions from anchor nodes store
  // PROTOTYPE: Anchors are now XYFlow nodes, positions come from their node positions
  const anchorPositions = useAnchorNodePositions(edgeId)

  // Source and target points for anchor calculations
  const source = useMemo(() => ({ x: sourceX, y: sourceY }), [sourceX, sourceY])
  const target = useMemo(() => ({ x: targetX, y: targetY }), [targetX, targetY])

  // Path calculations, memoized to avoid recalculating on every render
  // ALWAYS use Catmull-Rom with virtual anchors (even with 0 user anchors)
  // This preserves the natural S-curve from handle positions consistently
  const pathData = useMemo(() => {
    const edgePath = catmullRomToBezierPath(
      source,
      target,
      anchorPositions,
      sourcePosition,
      targetPosition,
    )
    return { edgePath, parallelPath: edgePath }
  }, [source, target, anchorPositions, sourcePosition, targetPosition, curveConfig])

  // Ghost anchors (only when selected)
  // PROTOTYPE: Ghost anchors are SVG visual hints, not XYFlow nodes
  // When dragged, they create anchor nodes
  const ghostAnchors = useMemo(() => {
    if (!isSelected)
      return []
    return calculateGhostAnchors(source, target, anchorPositions, sourcePosition, targetPosition)
  }, [isSelected, source, target, anchorPositions, sourcePosition, targetPosition, curveConfig])

  // Helper: Find group node at position (for auto-parenting anchors)
  // Uses granular $groupNodes store instead of $nodes for performance
  const findGroupAtPosition = useCallback((x: number, y: number) => {
    const matchingGroups: Array<{ nodeId: string, depth: number }> = []

    // Iterate ONLY group nodes (not all nodes!)
    for (const [nodeId, groupData] of groupNodes) {
      // Get absolute position via existing helper
      const absPos = getAbsoluteNodePosition(nodeId, nodePositionData)
      if (!absPos)
        continue

      const isInside = x >= absPos.x
        && x <= absPos.x + groupData.dimensions.width
        && y >= absPos.y
        && y <= absPos.y + groupData.dimensions.height

      if (isInside) {
        matchingGroups.push({
          nodeId,
          depth: calculateNodeDepth(nodeId, nodePositionData),
        })
      }
    }

    if (matchingGroups.length === 0)
      return null

    // Return deepest (most nested) group
    matchingGroups.sort((a, b) => b.depth - a.depth)

    return {
      id: matchingGroups[0].nodeId,
      ...groupNodes.get(matchingGroups[0].nodeId)!,
    }
  }, [groupNodes, nodePositionData])

  // Ghost anchor click creates an anchor node
  // Auto-detects if position is inside a group and parents accordingly
  const handleGhostClick = useCallback((insertIndex: number, x: number, y: number) => {
    // Check if position is inside any group
    const parentGroup = findGroupAtPosition(x, y)

    let anchorX = x
    let anchorY = y
    let parentNodeId: string | undefined

    if (parentGroup) {
      // Get absolute position of group
      const groupAbsPos = getAbsoluteNodePosition(parentGroup.id, nodePositionData)
      if (groupAbsPos) {
        // Convert to relative coordinates
        anchorX = x - groupAbsPos.x
        anchorY = y - groupAbsPos.y
        parentNodeId = parentGroup.id
      }
    }

    addAnchorNode({
      edgeId,
      x: anchorX,
      y: anchorY,
      index: insertIndex,
      color: stroke,
      parentNodeId,
    })
  }, [edgeId, stroke, findGroupAtPosition, nodePositionData])

  // Generate a lighter version of the stroke color for the secondary path, memoized
  const secondaryColor = useMemo(() =>
    getLighterColor(stroke), [stroke])

  // Reference to the path element for animations
  const pathRef = useRef<SVGPathElement>(null)

  // Store path length using state to ensure reactive updates
  const [pathLength, setPathLength] = useState(0)

  // Only update path length when the path changes
  useEffect(() => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength()
      setPathLength(length)
    }
  }, [pathData.edgePath])

  // Ensure each edge has a stable animation ID (needed for global animation state)
  const stableAnimId = useMemo(() => id, [id])

  // Generate consistent dash offset values for animations
  const dashOffsets = useMemo(() => {
    return {
      base: pathLength > 0 ? [-pathLength * 0.5, 0] : [0, 0],
      dots: strokeWidth > 0 ? [-strokeWidth * 16, 0] : [0, 0],
      accent: strokeWidth > 0 ? [-strokeWidth * 16, 0] : [0, 0],
    }
  }, [pathLength, strokeWidth])

  // Standard edge without animation - simplified rendering path
  if (!data?.animated) {
    return (
      <g>
        {/* Base path - slightly thicker */}
        <path
          id={`${id}-base`}
          d={pathData.parallelPath}
          fill="none"
          // stroke={secondaryColor}
          stroke={theme === 'dark' ? secondaryColor : stroke}
          strokeWidth={strokeWidth * 1.2}
          strokeOpacity={strokeOpacity * 0.5}
          strokeLinejoin="round"
        />

        {/* Main path */}
        <path
          id={id}
          d={pathData.edgePath}
          ref={pathRef}
          fill="none"
          // stroke={stroke}
          stroke={theme === 'dark' ? stroke : secondaryColor}
          strokeWidth={isSelected ? strokeWidth * 1.5 : (isHovered ? strokeWidth * 1.2 : strokeWidth)}
          strokeOpacity={strokeOpacity}
          strokeLinecap="round"
          markerEnd={markerEnd}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{ cursor: 'pointer', transition: 'stroke-width 0.15s ease' }}
        />

        {/* Selection highlight */}
        {isSelected && (
          <path
            d={pathData.edgePath}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth * 3}
            strokeOpacity={0.2}
          />
        )}

        {/* Ghost anchors (only when selected) */}
        {/* PROTOTYPE: Ghost anchors are SVG visual hints that create anchor nodes on click */}
        {/* Real anchors are rendered as XYFlow nodes by the Flow component */}
        {isSelected && ghostAnchors.map(ghost => (
          <circle
            key={`ghost-${ghost.insertIndex}`}
            cx={ghost.x}
            cy={ghost.y}
            r={6}
            fill="white"
            stroke={stroke}
            strokeWidth={2}
            opacity={0.5}
            style={{ cursor: 'crosshair', pointerEvents: 'auto' }}
            onClick={(e) => {
              e.stopPropagation()
              handleGhostClick(ghost.insertIndex, ghost.x, ghost.y)
            }}
          />
        ))}
      </g>
    )
  }

  // Animated edge for active data flows
  return (
    <g>
      {/* Base path - slightly thicker with subtle animation */}
      <motion.path
        id={`${id}-base`}
        d={pathData.parallelPath}
        fill="none"
        stroke={secondaryColor}
        strokeWidth={strokeWidth * 1.2}
        strokeOpacity={strokeOpacity * 0.4}
        strokeLinejoin="round"
        initial={{ strokeDasharray: pathLength, strokeDashoffset: 0 }}
        animate={{ strokeDashoffset: dashOffsets.base }}
        transition={{
          duration: 3,
          ease: 'linear',
          repeat: Infinity,
        }}
      />

      {/* Main visible path */}
      <path
        id={id}
        d={pathData.edgePath}
        ref={pathRef}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeOpacity={strokeOpacity}
        strokeLinecap="round"
        markerEnd={markerEnd}
      />

      {/* Animated segments - flowing dots effect */}
      <motion.path
        d={pathData.edgePath}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth * 0.8}
        strokeLinecap="round"
        strokeDasharray={`${strokeWidth * 0.8} ${strokeWidth * 4}`}
        initial={{ strokeDashoffset: 0 }}
        animate={{ strokeDashoffset: dashOffsets.dots }}
        transition={{
          duration: 1.5,
          ease: 'linear',
          repeat: Infinity,
        }}
      />

      {/* Accent detail - subtle patterned line */}
      <motion.path
        d={pathData.edgePath}
        fill="none"
        stroke="white"
        strokeWidth={strokeWidth * 0.3}
        strokeOpacity={0.4}
        strokeLinecap="round"
        strokeDasharray={`${strokeWidth * 0.5} ${strokeWidth * 8}`}
        initial={{ strokeDashoffset: 0 }}
        animate={{ strokeDashoffset: dashOffsets.accent }}
        transition={{
          duration: 2,
          ease: 'linear',
          repeat: Infinity,
          delay: 0.2,
        }}
      />

      {/* Particle animations using manual animation to preserve positions between renders */}
      {pathRef.current !== null && pathLength > 0 && (
        <ParticleEffect
          edgeId={stableAnimId}
          pathRef={pathRef as React.RefObject<SVGPathElement>}
          pathLength={pathLength}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )}

      {/* Selection highlight */}
      {isSelected && (
        <path
          d={pathData.edgePath}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth * 3}
          strokeOpacity={0.2}
        />
      )}

      {/* Ghost anchors (only when selected) */}
      {/* PROTOTYPE: Ghost anchors are SVG visual hints that create anchor nodes on click */}
      {/* Real anchors are rendered as XYFlow nodes by the Flow component */}
      {isSelected && ghostAnchors.map(ghost => (
        <circle
          key={`ghost-${ghost.insertIndex}`}
          cx={ghost.x}
          cy={ghost.y}
          r={6}
          fill="white"
          stroke={stroke}
          strokeWidth={2}
          opacity={0.5}
          style={{ cursor: 'crosshair', pointerEvents: 'auto' }}
          onPointerDown={(e) => {
            e.stopPropagation()
            e.preventDefault() // Prevent text selection
            handleGhostClick(ghost.insertIndex, ghost.x, ghost.y)
          }}
        />
      ))}
    </g>
  )
})

FlowEdge.displayName = 'FlowEdge'
