/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EdgeProps } from '@xyflow/react'
import { getBezierPath } from '@xyflow/react'
import { motion } from 'framer-motion'
import React, { useMemo } from 'react'

/**
 * FlowEdge component with distinctive Chaingraph styling
 * Features a unique, animated path design with dual-line aesthetics
 */
export function FlowEdge({
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
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  // Calculate a parallel path with slight offset for the dual-line effect
  const [parallelPath] = getBezierPath({
    sourceX: sourceX + 2,
    sourceY: sourceY + 2,
    sourcePosition,
    targetX: targetX + 2,
    targetY: targetY + 2,
    targetPosition,
  })

  // Extract style properties with fallbacks
  const {
    stroke = 'currentColor',
    strokeWidth = 2,
    strokeOpacity = 1,
  } = style as { stroke: string, strokeWidth: number, strokeOpacity: number }

  // Generate a lighter version of the stroke color for the secondary path
  const secondaryColor = useMemo(() => {
    // This creates a slightly transparent version of the main color
    return stroke !== 'currentColor' ? `${stroke}99` : 'rgba(currentColor, 0.6)'
  }, [stroke])

  // Calculate path points for particle animation
  const pathRef = React.useRef<SVGPathElement>(null)
  const [pathLength, setPathLength] = React.useState(0)

  React.useEffect(() => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength()
      setPathLength(length)
    }
  }, [edgePath])

  // Calculate particle positions along the path
  const getPointAtLength = (len: number) => {
    if (!pathRef.current)
      return { x: 0, y: 0 }
    const point = pathRef.current.getPointAtLength(len)
    return { x: point.x, y: point.y }
  }

  // Standard edge without animation
  if (!data?.animated) {
    return (
      <g>
        {/* Base path - slightly thicker */}
        <path
          id={`${id}-base`}
          d={parallelPath}
          fill="none"
          stroke={secondaryColor}
          strokeWidth={strokeWidth * 1.2}
          strokeOpacity={strokeOpacity * 0.5}
          strokeLinejoin="round"
        />

        {/* Main path */}
        <path
          id={id}
          d={edgePath}
          ref={pathRef}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeOpacity={strokeOpacity}
          strokeLinecap="round"
          markerEnd={markerEnd}
        />
      </g>
    )
  }

  // Animated edge for active data flows
  return (
    <g>
      {/* Base path - slightly thicker with subtle animation */}
      <motion.path
        id={`${id}-base`}
        d={parallelPath}
        fill="none"
        stroke={secondaryColor}
        strokeWidth={strokeWidth * 1.2}
        strokeOpacity={strokeOpacity * 0.4}
        strokeLinejoin="round"
        initial={{ strokeDasharray: pathLength, strokeDashoffset: 0 }}
        animate={{ strokeDashoffset: [-pathLength * 0.5, 0] }}
        transition={{
          duration: 3,
          ease: 'linear',
          repeat: Infinity,
        }}
      />

      {/* Main visible path */}
      <motion.path
        id={id}
        d={edgePath}
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
        d={edgePath}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth * 0.8}
        strokeLinecap="round"
        strokeDasharray={`${strokeWidth * 0.8} ${strokeWidth * 4}`}
        initial={{ strokeDashoffset: 0 }}
        animate={{ strokeDashoffset: [-strokeWidth * 16, 0] }}
        transition={{
          duration: 1.5,
          ease: 'linear',
          repeat: Infinity,
        }}
      />

      {/* Accent detail - subtle patterned line */}
      <motion.path
        d={edgePath}
        fill="none"
        stroke="white"
        strokeWidth={strokeWidth * 0.3}
        strokeOpacity={0.4}
        strokeLinecap="round"
        strokeDasharray={`${strokeWidth * 0.5} ${strokeWidth * 8}`}
        initial={{ strokeDashoffset: 0 }}
        animate={{ strokeDashoffset: [-strokeWidth * 16, 0] }}
        transition={{
          duration: 2,
          ease: 'linear',
          repeat: Infinity,
          delay: 0.2,
        }}
      />

      {/* Particle animations using Framer Motion's animate prop instead of SVG animateMotion */}
      <ParticleEffect
        pathRef={pathRef}
        pathLength={pathLength}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </g>
  )
}

// Separate component for particle effects to keep the main component clean
function ParticleEffect({
  pathRef,
  pathLength,
  stroke,
  strokeWidth,
}: {
  pathRef: React.RefObject<SVGPathElement>
  pathLength: number
  stroke: string
  strokeWidth: number
}) {
  const [particles, setParticles] = React.useState<Array<{ x: number, y: number }>>([
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ])

  // Animation effect for particles
  React.useEffect(() => {
    if (!pathRef.current || pathLength === 0)
      return

    let animationFrameId: number
    let progress = 0
    let secondaryProgress = [0.25, 0.5, 0.75]

    const animateParticles = () => {
      if (!pathRef.current)
        return

      // Calculate positions
      progress = (progress + 0.005) % 1
      secondaryProgress = secondaryProgress.map(p => (p + 0.003) % 1)

      const mainPoint = pathRef.current.getPointAtLength(progress * pathLength)
      const secondaryPoints = secondaryProgress.map(p =>
        pathRef.current!.getPointAtLength(p * pathLength),
      )

      setParticles([
        { x: mainPoint.x, y: mainPoint.y },
        ...secondaryPoints,
      ])

      animationFrameId = requestAnimationFrame(animateParticles)
    }

    animateParticles()
    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [pathRef, pathLength])

  return (
    <>
      {/* Main particle */}
      <motion.circle
        cx={particles[0].x}
        cy={particles[0].y}
        r={strokeWidth * 1.2}
        fill={stroke}
        initial={{ opacity: 0.8 }}
        animate={{ opacity: [0.8, 1, 0.8], scale: [1, 1.2, 1] }}
        transition={{
          duration: 1.2,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
      />

      {/* Secondary particles */}
      {particles.slice(1).map((particle, i) => (
        <motion.circle
          key={`particle-${i}`}
          cx={particle.x}
          cy={particle.y}
          r={strokeWidth * 0.6}
          fill="white"
          opacity={0.7}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.8, 1, 0.8] }}
          transition={{
            duration: 0.8,
            ease: 'easeInOut',
            repeat: Infinity,
            delay: i * 0.3,
          }}
        />
      ))}
    </>
  )
}
