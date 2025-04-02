/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategoryIconName } from '@badaitech/chaingraph-nodes'
import type { CategoryStyle, INode } from '@badaitech/chaingraph-types'
import type { PortContextValue } from './ports/context/PortContext'
import { cn } from '@/lib/utils'
import { getCategoryIcon } from '@badaitech/chaingraph-nodes'
import { NodeStatus } from '@badaitech/chaingraph-types'
import { Cross1Icon } from '@radix-ui/react-icons'
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
import { useCallback, useEffect, useRef, useState } from 'react'
import NodeFlowPorts from './NodeFlowPorts'

interface NodeHeaderProps {
  // title: string
  node: INode
  icon: CategoryIconName
  style: CategoryStyle['light'] | CategoryStyle['dark']
  onDelete?: () => void
  context: PortContextValue

  debugMode: boolean
  isBreakpointSet: boolean
  onBreakpointToggle: () => void
}

export function NodeHeader({
  node,
  icon,
  style,
  onDelete,
  context,
  debugMode,
  isBreakpointSet,
  onBreakpointToggle,
}: NodeHeaderProps) {
  const Icon = getCategoryIcon(icon)
  const [prevStatus, setPrevStatus] = useState<NodeStatus | null>(null)
  const [showStatusBadge, setShowStatusBadge] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle status changes
  useEffect(() => {
    // Don't show for Idle or Initialized states
    if (node.status === NodeStatus.Idle || node.status === NodeStatus.Initialized) {
      setShowStatusBadge(false)
      setPrevStatus(node.status)
      return
    }

    // Only trigger animation on status change
    if (node.status !== prevStatus) {
      // Clear existing timeout to prevent multiple badges
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Show the status badge
      setShowStatusBadge(true)

      // Auto-hide the badge after 5 seconds for non-permanent states
      // Keep showing for Completed, Error, and Skipped states
      if (![NodeStatus.Completed, NodeStatus.Error, NodeStatus.Skipped].includes(node.status)) {
        timeoutRef.current = setTimeout(() => {
          setShowStatusBadge(false)
        }, 5000)
      }

      // Update the previous status
      setPrevStatus(node.status)
    }

    // Clean up timeouts
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [node.status, prevStatus])

  //

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.()
  }, [onDelete])

  return (
    <div
      className={cn(
        'px-3 py-2 flex items-center justify-between',
        'border-b rounded-t-lg',
      )}
      style={{
        background: style.primary,
        borderBottom: `1px solid ${style.secondary}`,
      }}
    >
      <NodeFlowPorts node={node} context={context} />

      <div className="flex items-center gap-2 min-w-0 relative">
        <div
          className="w-6 min-w-6 h-6 rounded flex items-center justify-center"
          style={{
            background: `${style.text}20`,
          }}
        >
          <Icon
            className="w-4 h-4"
            style={{ color: style.text }}
          />
        </div>

        <h3
          className="font-medium text-sm truncate"
          style={{ color: style.text }}
        >
          {node.metadata.title}
        </h3>

        {/* Animated Status Badge */}
        <AnimatePresence>
          {showStatusBadge && node.status !== NodeStatus.Idle && node.status !== NodeStatus.Initialized && (
            <motion.div
              className="absolute top-0 left-1/2 z-[50]"
              initial={{ y: -20, x: '-50%', opacity: 0, scale: 0.5 }}
              animate={{
                y: -45,
                x: '-60%',
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
                x: '-50%',
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
                  'px-2 py-0.5 text-xs min-w-max whitespace-nowrap',
                  'font-medium rounded-full flex items-center gap-1.5 shadow-md border border-opacity-20',
                )}
                style={{
                  backgroundColor: getStatusColor(node.status).bg,
                  color: getStatusColor(node.status).text,
                  borderColor: getStatusColor(node.status).border,
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
                    repeat: node.status === NodeStatus.Executing ? Infinity : 0,
                    repeatDelay: 1,
                  }}
                >
                  {getStatusIcon(node.status, 'w-3.5 h-3.5')}
                </motion.div>
                <motion.span
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  {node.status}
                </motion.span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <button
          className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors nodrag"
          style={{ color: style.text }}
          onClick={handleDelete}
          title="Delete"
          type="button"
        >
          <Cross1Icon className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
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
