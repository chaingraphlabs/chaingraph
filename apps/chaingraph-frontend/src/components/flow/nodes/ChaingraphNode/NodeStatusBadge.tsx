/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { cn } from '@/lib/utils'
import { NodeStatus } from '@badaitech/chaingraph-types'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Cog,
  Layers,
  Pause,
  Play,
  SkipForward,
  Trash,
} from 'lucide-react'
import { memo, useEffect, useRef } from 'react'

interface NodeStatusBadgeProps {
  status: NodeStatus
  prevStatus: NodeStatus | null
  showBadge: boolean
  onStatusChange: (show: boolean, status: NodeStatus | null) => void
}

// Helper function to get the appropriate icon for each status
function getStatusIcon(status: NodeStatus, className: string = '') {
  switch (status) {
    case NodeStatus.Idle:
      return <Pause className={className} />
    case NodeStatus.Initialized:
      return <Cog className={className} />
    case NodeStatus.Ready:
      return <CheckCircle className={className} />
    case NodeStatus.Pending:
      return <Clock className={className} />
    case NodeStatus.Executing:
      return <Play className={className} />
    case NodeStatus.Backgrounding:
      return <Layers className={className} />
    case NodeStatus.Completed:
      return <CheckCircle className={className} />
    case NodeStatus.Skipped:
      return <SkipForward className={className} />
    case NodeStatus.Error:
      return <AlertCircle className={className} />
    case NodeStatus.Disposed:
      return <Trash className={className} />
  }
}

// Helper function to get appropriate colors for each status
function getStatusColor(status: NodeStatus) {
  switch (status) {
    case NodeStatus.Idle:
      return { bg: 'rgb(229 231 235 / 0.8)', text: 'rgb(75 85 99)', border: 'rgb(156 163 175)' }
    case NodeStatus.Initialized:
      return { bg: 'rgb(219 234 254 / 0.8)', text: 'rgb(37 99 235)', border: 'rgb(59 130 246)' }
    case NodeStatus.Ready:
      return { bg: 'rgb(220 252 231 / 0.8)', text: 'rgb(22 163 74)', border: 'rgb(34 197 94)' }
    case NodeStatus.Pending:
      return { bg: 'rgb(254 240 138 / 0.8)', text: 'rgb(202 138 4)', border: 'rgb(234 179 8)' }
    case NodeStatus.Executing:
      return { bg: 'rgb(219 234 254 / 0.8)', text: 'rgb(30 64 175)', border: 'rgb(37 99 235)' }
    case NodeStatus.Backgrounding:
      return { bg: 'rgb(233 213 255 / 0.8)', text: 'rgb(126 34 206)', border: 'rgb(147 51 234)' }
    case NodeStatus.Completed:
      return { bg: 'rgb(220 252 231 / 0.8)', text: 'rgb(22 101 52)', border: 'rgb(22 163 74)' }
    case NodeStatus.Skipped:
      return { bg: 'rgb(229 231 235 / 0.8)', text: 'rgb(75 85 99)', border: 'rgb(107 114 128)' }
    case NodeStatus.Error:
      return { bg: 'rgb(254 226 226 / 0.8)', text: 'rgb(185 28 28)', border: 'rgb(239 68 68)' }
    case NodeStatus.Disposed:
      return { bg: 'rgb(209 213 219 / 0.8)', text: 'rgb(55 65 81)', border: 'rgb(107 114 128)' }
  }
}

// The component handles its own timer logic and animation state
function NodeStatusBadge({ status, prevStatus, showBadge, onStatusChange }: NodeStatusBadgeProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle status changes and timeouts
  useEffect(() => {
    // Don't show for Idle or Initialized states
    if (status === NodeStatus.Idle || status === NodeStatus.Initialized) {
      onStatusChange(false, status)
      return
    }

    // Only trigger animation on status change
    if (status !== prevStatus) {
      // Clear existing timeout to prevent multiple badges
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Show the status badge
      onStatusChange(true, status)

      // Auto-hide the badge after 5 seconds for non-permanent states
      // Keep showing for Completed, Error, and Skipped states
      if (![NodeStatus.Completed, NodeStatus.Error, NodeStatus.Skipped].includes(status)) {
        timeoutRef.current = setTimeout(() => {
          onStatusChange(false, status)
        }, 5000)
      }
    }

    // Clean up timeouts on unmount or status change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [status, prevStatus, onStatusChange])

  // Render nothing if the badge shouldn't be shown
  if (!showBadge || status === NodeStatus.Idle || status === NodeStatus.Initialized) {
    return null
  }

  // Get status-specific styling
  const statusColor = getStatusColor(status)

  return (
    <AnimatePresence>
      <motion.div
        className="absolute top-0 left-1/2 z-[50]"
        initial={{ y: -20, x: '-50%', opacity: 0, scale: 0.5 }}
        animate={{
          y: -45,
          x: '-50%',
          opacity: 1,
          scale: 1,
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 20,
          },
        }}
        exit={{
          y: -70,
          x: '0%',
          opacity: 0,
          scale: 0.8,
          transition: {
            duration: 0.3,
            ease: 'easeOut',
          },
        }}
      >
        <motion.div
          className={cn(
            'px-2 py-0.5 text-md font-bold min-w-max whitespace-nowrap',
            'font-medium rounded-full flex items-center gap-1.5 shadow-md border border-opacity-20',
            status === 'executing' && 'animate-bounce',
            // status === 'executing' && 'animate-pulse',
            // status === 'pending' && 'animate-pulse',
            // status === 'error' && 'animate-ping',
            // status === 'completed' && 'animate-pulse',
          )}
          style={{
            backgroundColor: statusColor.bg,
            color: statusColor.text,
            borderColor: statusColor.border,
          }}
          initial={{ rotate: -5 }}
          animate={{
            rotate: [null, 5, -3, 2, 0],
            scale: [null, 1.1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: 0.8,
            times: [0, 0.2, 0.4, 0.6, 1],
            ease: 'easeInOut',
          }}
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{
              duration: 1.5,
              ease: 'easeInOut',
              times: [0, 1],
              repeat: status === NodeStatus.Executing ? Infinity : 0,
              repeatDelay: 1,
            }}
          >
            {getStatusIcon(status, 'w-3.5 h-3.5')}
          </motion.div>
          <motion.span
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {status}
          </motion.span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default memo(NodeStatusBadge)
