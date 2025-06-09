/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionEventImpl } from '@badaitech/chaingraph-types'
import { eventThemes } from '@/components/sidebar/tabs/debug/theme'
import { useTheme } from '@/components/theme/hooks/useTheme'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { setHighlightedEdgeId, setHighlightedNodeId } from '@/store/execution'
import { ExecutionEventEnum } from '@badaitech/chaingraph-types'
import { ChevronDownIcon, Clock } from 'lucide-react'
import React, { memo, useCallback, useMemo, useState } from 'react'
import { EventDetails } from './EventDetails'
import { EventTitle } from './EventTitle'
import 'react-json-view-lite/dist/index.css'
import './style/json.css'

interface EventCardProps {
  event: ExecutionEventImpl
  index: number
}

// Helper function to get node IDs from event for highlighting
function getNodeDataFromEvent(event: ExecutionEventImpl): string | string[] | null {
  switch (event.type) {
    case ExecutionEventEnum.NODE_STARTED:
    case ExecutionEventEnum.NODE_COMPLETED:
    case ExecutionEventEnum.NODE_FAILED:
    case ExecutionEventEnum.NODE_SKIPPED:
    case ExecutionEventEnum.NODE_STATUS_CHANGED:
    case ExecutionEventEnum.DEBUG_BREAKPOINT_HIT:
    case ExecutionEventEnum.NODE_DEBUG_LOG_STRING:
      return (event.data as any).node.id

    case ExecutionEventEnum.EDGE_TRANSFER_STARTED:
    case ExecutionEventEnum.EDGE_TRANSFER_COMPLETED:
    case ExecutionEventEnum.EDGE_TRANSFER_FAILED: {
      const edge = (event.data as any).edge
      return [edge.sourceNode.id, edge.targetNode.id]
    }

    default:
      return null
  }
}

function getEdgeDataFromEvent(event: ExecutionEventImpl): string | null {
  switch (event.type) {
    case ExecutionEventEnum.EDGE_TRANSFER_STARTED:
    case ExecutionEventEnum.EDGE_TRANSFER_COMPLETED:
    case ExecutionEventEnum.EDGE_TRANSFER_FAILED:
      return (event.data as any).edge.id

    default:
      return null
  }
}

// Helper function to format timestamp
function formatTimestamp(timestamp: Date): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// Main optimized EventCard component
export const OptimizedEventCard = memo(({ event, index }: EventCardProps) => {
  const { theme: themeMode } = useTheme()
  const eventTheme = eventThemes[event.type]
  const [isExpanded, setIsExpanded] = useState(false)

  // Format timestamp only once per event
  const formattedTime = useMemo(() => formatTimestamp(event.timestamp), [event.timestamp])

  // Memoize handler functions
  const handleHighlight = useCallback(() => {
    const nodeData = getNodeDataFromEvent(event)
    const edgeData = getEdgeDataFromEvent(event)

    if (nodeData) {
      setHighlightedNodeId(Array.isArray(nodeData) ? nodeData : [nodeData])
    }

    if (edgeData) {
      setHighlightedEdgeId(edgeData)
    }
  }, [event])

  const handleClearHighlight = useCallback(() => {
    setHighlightedNodeId(null)
    setHighlightedEdgeId(null)
  }, [])

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  // Using CSS transitions instead of Framer Motion for better performance
  return (
    <div
      className="group transition-transform duration-200 ease-out"
      style={{ transform: `translateY(0px)` }} // Static transform helps GPU acceleration
      onMouseEnter={handleHighlight}
      onMouseLeave={handleClearHighlight}
    >
      <Card
        className={cn(
          'transition-all duration-200 mb-1.5',
          'border-l-4 dark:border-l-4 border-t-0 border-r-0 border-b-0',
          themeMode === 'dark' ? eventTheme.color.dark : eventTheme.color.light,
          isExpanded ? 'rounded-md' : 'rounded-sm',
        )}
      >
        <div
          className={cn(
            'flex items-start p-2.5 gap-2',
            'cursor-pointer',
            isExpanded && 'pb-0',
          )}
          onClick={toggleExpand}
        >
          {/* Icon */}
          <div className={cn(
            'flex-shrink-0 w-5 h-5 flex items-center justify-center mt-0.5',
            themeMode === 'dark' ? eventTheme.color.dark : eventTheme.color.light,
          )}
          >
            <eventTheme.icon className="w-4 h-4" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <EventTitle event={event} />
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <time className="text-xs text-muted-foreground flex items-center">
              <Clock className="w-3 h-3 mr-1 opacity-70" />
              {formattedTime}
            </time>
            <ChevronDownIcon
              className={cn(
                'w-4 h-4 text-muted-foreground transition-transform duration-200',
                isExpanded ? 'rotate-180' : '',
              )}
            />
          </div>
        </div>

        {/* Expanded content - only render when expanded */}
        <div
          className={cn(
            'px-2.5 pb-2.5 pt-1 transition-all duration-200',
            isExpanded ? 'opacity-100 max-h-[550px]' : 'opacity-0 max-h-0',
          )}
        >
          <div className="pl-7 border-t dark:border-border/30 pt-2">
            <EventDetails event={event} isVisible={isExpanded} />
          </div>
        </div>

        {/* CSS-based hover effect instead of Framer Motion */}
        <div
          className={cn(
            'absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-200 pointer-events-none',
            themeMode === 'dark' ? eventTheme.bgColor.dark : eventTheme.bgColor.light,
          )}
        />
      </Card>
    </div>
  )
})

OptimizedEventCard.displayName = 'OptimizedEventCard'
