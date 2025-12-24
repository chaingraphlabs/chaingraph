/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EdgeAnchor } from '@badaitech/chaingraph-types'
import type { EdgeProps } from '@xyflow/react'
import { BaseEdge, getBezierPath, useReactFlow } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { motion } from 'framer-motion'
import { nanoid } from 'nanoid'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { $edgeAnchors, addAnchorLocal, moveAnchorLocal, removeAnchorLocal } from '@/store/edges/anchors'
import { $selectedEdgeId } from '@/store/edges/selection'
import { $curveConfig } from '@/store/settings/curve-config'
import { AnchorHandle } from './components/AnchorHandle'
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
  const { screenToFlowPosition } = useReactFlow()

  // Anchor support
  const selectedEdgeId = useUnit($selectedEdgeId)
  const anchorsMap = useUnit($edgeAnchors)
  const curveConfig = useUnit($curveConfig)
  const isSelected = selectedEdgeId === id
  const edgeId = (data as any)?.edgeData?.edgeId ?? id

  // Hover state for visual feedback
  const [isHovered, setIsHovered] = useState(false)

  // Get anchors from local store ONLY (no fallback to edge data)
  // Anchors are initialized from edge metadata in stores.ts on flow load
  const localState = anchorsMap.get(edgeId)
  const anchors: EdgeAnchor[] = useMemo(
    () => localState?.anchors ?? [],
    [localState?.anchors],
  )

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
      anchors,
      sourcePosition,
      targetPosition,
    )
  }, [source, target, anchors, sourcePosition, targetPosition, curveConfig])

  // Ghost anchors (only when selected)
  const ghostAnchors = useMemo(() => {
    if (!isSelected)
      return []
    return calculateGhostAnchors(source, target, anchors, sourcePosition, targetPosition)
  }, [isSelected, source, target, anchors, sourcePosition, targetPosition, curveConfig])

  // Track ghost → real anchor ID mappings during drag
  const ghostToRealAnchorRef = useRef<Map<string, string>>(new Map())

  // Clear ghost-to-real mappings when edge is deselected
  useEffect(() => {
    if (!isSelected) {
      ghostToRealAnchorRef.current.clear()
    }
  }, [isSelected])

  // Anchor handlers
  const handleAnchorDrag = useCallback((anchorId: string, x: number, y: number) => {
    if (anchorId.startsWith('ghost-')) {
      // Check if we already created a real anchor for this ghost drag
      const existingRealId = ghostToRealAnchorRef.current.get(anchorId)
      if (existingRealId) {
        // Already created, just move it seamlessly
        moveAnchorLocal({ edgeId, anchorId: existingRealId, x, y })
      } else {
        // First drag event - create the anchor
        const insertIndex = Number.parseInt(anchorId.split('-')[1], 10)
        const newAnchor = {
          id: nanoid(8),
          x,
          y,
          index: insertIndex,
        }
        addAnchorLocal({ edgeId, anchor: newAnchor })
        // Store mapping so subsequent drags move instead of create
        ghostToRealAnchorRef.current.set(anchorId, newAnchor.id)
      }
    } else {
      moveAnchorLocal({ edgeId, anchorId, x, y })
    }
  }, [edgeId])

  const handleAnchorDragEnd = useCallback(() => {
    // Clear mapping when drag ends so next drag starts fresh
    ghostToRealAnchorRef.current.clear()
  }, [])

  const handleAnchorDelete = useCallback((anchorId: string) => {
    removeAnchorLocal({ edgeId, anchorId })
  }, [edgeId])

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

        {/* Anchor handles (only when selected) */}
        {isSelected && (
          <>
            {/* Real anchors */}
            {anchors.map(anchor => (
              <AnchorHandle
                key={anchor.id}
                id={anchor.id}
                edgeId={edgeId}
                x={anchor.x}
                y={anchor.y}
                isGhost={false}
                edgeColor={stroke || 'currentColor'}
                screenToFlowPosition={screenToFlowPosition}
                onDrag={handleAnchorDrag}
                onDragEnd={handleAnchorDragEnd}
                onDelete={handleAnchorDelete}
              />
            ))}

            {/* Ghost anchors */}
            {ghostAnchors.map(ghost => (
              <AnchorHandle
                key={`ghost-${ghost.insertIndex}`}
                id={`ghost-${ghost.insertIndex}`}
                edgeId={edgeId}
                x={ghost.x}
                y={ghost.y}
                isGhost={true}
                edgeColor={stroke || 'currentColor'}
                screenToFlowPosition={screenToFlowPosition}
                onDrag={handleAnchorDrag}
                onDragEnd={handleAnchorDragEnd}
                onDelete={() => { }}
              />
            ))}
          </>
        )}
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

      {/* Anchor handles (only when selected) */}
      {isSelected && (
        <>
          {/* Real anchors */}
          {anchors.map(anchor => (
            <AnchorHandle
              key={anchor.id}
              id={anchor.id}
              edgeId={edgeId}
              x={anchor.x}
              y={anchor.y}
              isGhost={false}
              edgeColor={stroke || 'currentColor'}
              screenToFlowPosition={screenToFlowPosition}
              onDrag={handleAnchorDrag}
              onDragEnd={handleAnchorDragEnd}
              onDelete={handleAnchorDelete}
            />
          ))}

          {/* Ghost anchors */}
          {ghostAnchors.map(ghost => (
            <AnchorHandle
              key={`ghost-${ghost.insertIndex}`}
              id={`ghost-${ghost.insertIndex}`}
              edgeId={edgeId}
              x={ghost.x}
              y={ghost.y}
              isGhost={true}
              edgeColor={stroke || 'currentColor'}
              screenToFlowPosition={screenToFlowPosition}
              onDrag={handleAnchorDrag}
              onDragEnd={handleAnchorDragEnd}
              onDelete={() => { }}
            />
          ))}
        </>
      )}
    </g>
  )
}
