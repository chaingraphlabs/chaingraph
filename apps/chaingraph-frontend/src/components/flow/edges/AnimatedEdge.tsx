/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { BaseEdge, type EdgeProps, getBezierPath } from '@xyflow/react'
import { motion } from 'framer-motion'
import React from 'react'

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
  // Get the path for drawing the edge
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

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
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={style}
      />
    )
  }

  // Use animated edge when requested
  return (
    <>
      {/* Animated edge with framer-motion */}
      <motion.path
        d={edgePath}
        fill="none"
        markerEnd={markerEnd}
        style={{
          ...restStyle,
        }}
        initial={{
          stroke: stroke || 'currentColor',
          strokeWidth: strokeWidth || 2,
          opacity: 0.6,
        }}
        animate={{
          stroke: stroke || 'currentColor',
          strokeWidth: strokeWidth || 2,
          opacity: strokeOpacity || 1,
        }}
        transition={{
          duration: 0.3,
          ease: 'easeInOut',
        }}
      />
    </>
  )
}
