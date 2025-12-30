/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EdgeProps } from '@xyflow/react'
import { BaseEdge } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { motion } from 'framer-motion'
import React, { useCallback, useMemo, useState } from 'react'
import { addAnchorNode } from '@/store/edges/anchor-nodes'
import { getAbsoluteNodePosition, calculateNodeDepth } from '@/store/edges/anchor-coordinates'
import { useAnchorNodePositions } from '@/store/edges/hooks/useAnchorNodePositions'
import { $selectedEdgeId } from '@/store/edges/selection'
import { $groupNodes, $nodePositionData } from '@/store/nodes/derived-stores'
import { $curveConfig } from '@/store/settings/curve-config'
import { calculateGhostAnchors, catmullRomToBezierPath } from './utils/catmull-rom'

interface AnimatedEdgeProps extends EdgeProps {
  data?: {
    animated?: boolean
    progress?: number
  }
}

/**
 * AnimatedEdge component that provides smooth transitions between different
 * edge states (color, opacity, stroke width)
 *
 * Only applies animation when data.animated is true, otherwise falls back to regular BaseEdge
 */
export function AnimatedEdge({
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
}: AnimatedEdgeProps) {
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

  // Get the path for drawing the edge
  // ALWAYS use Catmull-Rom with virtual anchors (even with 0 user anchors)
  // This preserves the natural S-curve from handle positions consistently
  const edgePath = useMemo(() => {
    return catmullRomToBezierPath(
      source,
      target,
      anchorPositions,
      sourcePosition,
      targetPosition,
    )
  }, [source, target, anchorPositions, sourcePosition, targetPosition, curveConfig])

  // Ghost anchors (only when selected)
  // PROTOTYPE: Ghost anchors are SVG visual hints, not XYFlow nodes
  // When clicked, they create anchor nodes
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
      if (!absPos) continue

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

    if (matchingGroups.length === 0) return null

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
    const { stroke = 'currentColor' } = style as { stroke?: string }

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
  }, [edgeId, style, findGroupAtPosition, nodePositionData])

  // Extract styles for the edge
  const { stroke, strokeWidth, strokeOpacity, ...restStyle } = style as {
    stroke: string
    strokeWidth: number
    strokeOpacity: number
    [key: string]: any
  }

  // Use regular BaseEdge when animation is not needed
  if (!data?.animated) {
    return (
      <g>
        <BaseEdge
          path={edgePath}
          markerEnd={markerEnd}
          style={{
            ...style,
            strokeWidth: isSelected ? (strokeWidth || 2) * 1.5 : (isHovered ? (strokeWidth || 2) * 1.2 : strokeWidth),
            cursor: 'pointer',
            transition: 'stroke-width 0.15s ease',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        />

        {/* Selection highlight */}
        {isSelected && (
          <path
            d={edgePath}
            fill="none"
            stroke={stroke || 'currentColor'}
            strokeWidth={(strokeWidth || 2) * 3}
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
            stroke={stroke || 'currentColor'}
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

  // Use animated edge when requested
  return (
    <g>
      {/* Animated edge with framer-motion */}
      <motion.path
        d={edgePath}
        fill="none"
        markerEnd={markerEnd}
        style={{
          ...restStyle,
          cursor: 'pointer',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{
          stroke: stroke || 'currentColor',
          strokeWidth: strokeWidth || 2,
          opacity: 0.6,
        }}
        animate={{
          stroke: stroke || 'currentColor',
          strokeWidth: isSelected ? (strokeWidth || 2) * 1.5 : (isHovered ? (strokeWidth || 2) * 1.2 : strokeWidth || 2),
          opacity: strokeOpacity || 1,
        }}
        transition={{
          duration: 0.15,
          ease: 'easeInOut',
        }}
      />

      {/* Selection highlight */}
      {isSelected && (
        <path
          d={edgePath}
          fill="none"
          stroke={stroke || 'currentColor'}
          strokeWidth={(strokeWidth || 2) * 3}
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
          stroke={stroke || 'currentColor'}
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
