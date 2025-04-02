/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { eventThemes } from '@/components/sidebar/tabs/debug/theme'
import { useTheme } from '@/components/theme/hooks/useTheme'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { setHighlightedEdgeId, setHighlightedNodeId } from '@/store/execution'
import { ExecutionEventEnum, type ExecutionEventImpl } from '@badaitech/chaingraph-types'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRightCircle,
  ChevronDownIcon,
  Clock,
  ExternalLink,
  Timer,
} from 'lucide-react'
import React, { useRef, useState } from 'react'
import { collapseAllNested, darkStyles, defaultStyles, JsonView } from 'react-json-view-lite'
import SuperJSON from 'superjson'
import 'react-json-view-lite/dist/index.css'
import './style/json.css'

interface EventCardProps {
  event: ExecutionEventImpl
  index: number
}

export function EventCard({ event, index }: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { theme: themeMode } = useTheme()
  const eventTheme = eventThemes[event.type]
  const cardRef = useRef<HTMLDivElement>(null)

  // Handle highlighting nodes and edges
  const handleHighlight = () => {
    const nodeData = getNodeDataFromEvent(event)
    const edgeData = getEdgeDataFromEvent(event)

    if (nodeData) {
      setHighlightedNodeId(Array.isArray(nodeData) ? nodeData : [nodeData])
    }

    if (edgeData) {
      setHighlightedEdgeId(edgeData)
    }
  }

  const handleClearHighlight = () => {
    setHighlightedNodeId(null)
    setHighlightedEdgeId(null)
  }

  // Format timestamp to be more readable
  const formattedTime = formatTimestamp(event.timestamp)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      onMouseEnter={handleHighlight}
      onMouseLeave={handleClearHighlight}
      className="group"
    >
      <Card
        ref={cardRef}
        className={cn(
          'relative overflow-hidden transition-all duration-200 mb-1.5',
          // 'hover:shadow-md dark:hover:shadow-accent/20 group-hover:z-10',
          'border-l-4 dark:border-l-4 border-t-0 border-r-0 border-b-0',
          themeMode === 'dark' ? eventTheme.color.dark : eventTheme.color.light,
          isExpanded ? 'rounded-md' : 'rounded-sm',
          // canHighlight(event) && 'cursor-pointer',
        )}
        // style={{
        //   background: themeMode === 'dark'
        //     ? `linear-gradient(90deg, ${getColorWithOpacity(eventTheme.bgColor.dark, 0.2)} 0%, transparent 100%)`
        //     : `linear-gradient(90deg, ${getColorWithOpacity(eventTheme.bgColor.light, 0.2)} 0%, transparent 100%)`,
        // }}
      >
        <div
          className={cn(
            'flex items-start p-2.5 gap-2',
            'cursor-pointer',
            isExpanded && 'pb-0',
          )}
          onClick={() => setIsExpanded(!isExpanded)}
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
          <div className="flex-1 min-w-0">
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

        {/* Expanded content */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="px-2.5 pb-2.5 pt-1"
          >
            <div className="pl-7 border-t dark:border-border/30 pt-2">
              <EventDetails event={event} />
            </div>
          </motion.div>
        )}

        {/* Hover gradient effect */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-10 pointer-events-none"
          style={{
            background: themeMode === 'dark'
              ? `linear-gradient(90deg, ${getColorWithOpacity(eventTheme.bgColor.dark, 0.1)} 0%, transparent 100%)`
              : `linear-gradient(90deg, ${getColorWithOpacity(eventTheme.bgColor.light, 0.1)} 0%, transparent 100%)`,
          }}
          transition={{ duration: 0.2 }}
        />
      </Card>
    </motion.div>
  )
}

function EventTitle({ event }: { event: ExecutionEventImpl }) {
  const { theme: themeMode } = useTheme()

  switch (event.type) {
    // Flow Events
    case ExecutionEventEnum.FLOW_SUBSCRIBED:
      return (
        <span className="text-sm font-medium">
          Subscribed to flow "
          <span className="font-semibold">{(event.data as any).flow.metadata.name}</span>
          "
        </span>
      )

    case ExecutionEventEnum.FLOW_STARTED:
      return (
        <span className="text-sm font-medium">
          Flow started "
          <span className="font-semibold">{(event.data as any).flow.metadata.name}</span>
          "
        </span>
      )

    case ExecutionEventEnum.FLOW_COMPLETED:
      return (
        <span className="text-sm font-medium flex items-center gap-2">
          Flow completed
          <Badge variant="outline" className="text-xs font-normal">
            <Timer className="w-3 h-3 mr-1" />
            {(event.data as any).executionTime}
            ms
          </Badge>
        </span>
      )

    case ExecutionEventEnum.FLOW_FAILED:
      return (
        <div className="text-sm font-medium space-y-1">
          <div>Flow failed</div>
          <Badge variant="destructive" className="text-xs font-normal">
            <AlertCircle className="w-3 h-3 mr-1" />
            {(event.data as any).error.message}
          </Badge>
        </div>
      )

    case ExecutionEventEnum.FLOW_CANCELLED:
      return (
        <div className="text-sm font-medium space-y-1">
          <div>Flow cancelled</div>
          <Badge variant="secondary" className="text-xs font-normal">
            {(event.data as any).reason}
          </Badge>
        </div>
      )

    case ExecutionEventEnum.FLOW_PAUSED:
      return (
        <div className="text-sm font-medium space-y-1">
          <div>Flow paused</div>
          <Badge variant="secondary" className="text-xs font-normal">
            {(event.data as any).reason}
          </Badge>
        </div>
      )

    case ExecutionEventEnum.FLOW_RESUMED:
      return <span className="text-sm font-medium">Flow resumed</span>

    // Node Events
    case ExecutionEventEnum.NODE_STARTED:
      return (
        <span className="text-sm">
          Node "
          <span className="font-medium">{(event.data as any).node.metadata.title}</span>
          " started
        </span>
      )

    case ExecutionEventEnum.NODE_COMPLETED:
      return (
        <span className="text-sm flex items-center gap-2">
          Node
          <span className="font-medium">
            "
            {(event.data as any).node.metadata.title}
            "
          </span>
          completed
          <Badge variant="outline" className="text-xs font-normal">
            <Timer className="w-3 h-3 mr-1" />
            {(event.data as any).executionTime}
            ms
          </Badge>
        </span>
      )

    case ExecutionEventEnum.NODE_FAILED:
      return (
        <div className="text-sm space-y-1">
          <div>
            Node "
            <span className="font-medium">{(event.data as any).node.metadata.title}</span>
            " failed
          </div>
          <Badge variant="destructive" className="text-xs font-normal flex items-center gap-1 self-start">
            <AlertCircle className="w-3 h-3" />
            {(event.data as any).error.message}
          </Badge>
        </div>
      )

    case ExecutionEventEnum.NODE_SKIPPED:
      return (
        <div className="text-sm space-y-1">
          <div>
            Node "
            <span className="font-medium">{(event.data as any).node.metadata.title}</span>
            " skipped
          </div>
          <Badge variant="secondary" className="text-xs font-normal">
            {(event.data as any).reason}
          </Badge>
        </div>
      )

    case ExecutionEventEnum.NODE_STATUS_CHANGED:
      return (
        <span className="text-sm">
          <span className="font-medium">{(event.data as any).node.metadata.title}</span>
          <span className="text-muted-foreground"> status changed </span>
          <Badge variant="outline" className="text-xs font-normal mx-1">
            {(event.data as any).oldStatus}
          </Badge>
          <ArrowRightCircle className="w-3 h-3 inline mx-1" />
          <Badge variant="secondary" className="text-xs font-normal">
            {(event.data as any).newStatus}
          </Badge>
        </span>
      )

    // Edge Events
    case ExecutionEventEnum.EDGE_TRANSFER_STARTED: {
      const edge = (event.data as any).edge
      return (
        <div className="text-sm space-y-1">
          <div className="text-muted-foreground text-xs">Transfer started</div>
          <div className="flex items-center gap-1">
            <span className="font-medium">{edge.sourceNode.metadata.title}</span>
            <span className="text-xs text-muted-foreground">
              [
              {edge.sourcePort.getConfig().title}
              ]
            </span>
            <ArrowRightCircle className="w-3 h-3 mx-1" />
            <span className="font-medium">{edge.targetNode.metadata.title}</span>
            <span className="text-xs text-muted-foreground">
              [
              {edge.targetPort.getConfig().title}
              ]
            </span>
          </div>
        </div>
      )
    }

    case ExecutionEventEnum.EDGE_TRANSFER_COMPLETED: {
      const edge = (event.data as any).edge
      return (
        <div className="text-sm space-y-1">
          <div className="text-muted-foreground text-xs">Transfer completed</div>
          <div className="flex items-center gap-1">
            <span className="font-medium">{edge.sourceNode.metadata.title}</span>
            <ArrowRightCircle className="w-3 h-3 mx-1" />
            <span className="font-medium">{edge.targetNode.metadata.title}</span>
          </div>
        </div>
      )
    }

    case ExecutionEventEnum.EDGE_TRANSFER_FAILED: {
      const edge = (event.data as any).edge
      return (
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-1">
            <span className="font-medium">{edge.sourceNode.metadata.title}</span>
            <ArrowRightCircle className="w-3 h-3 mx-1" />
            <span className="font-medium">{edge.targetNode.metadata.title}</span>
          </div>
          <Badge variant="destructive" className="text-xs font-normal flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {(event.data as any).error.message}
          </Badge>
        </div>
      )
    }

    // Debug Events
    case ExecutionEventEnum.DEBUG_BREAKPOINT_HIT:
      return (
        <span className="text-sm">
          Breakpoint hit at node "
          <span className="font-medium">{(event.data as any).node.metadata.title}</span>
          "
        </span>
      )

    default:
      return <span className="text-sm text-muted-foreground">{event.type}</span>
  }
}

function EventDetails({ event }: { event: ExecutionEventImpl }) {
  const { theme } = useTheme()

  return (
    <div className="space-y-3 width-[100%]">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Event Type</div>
          <Badge variant="outline" className="text-xs font-normal">
            {event.type}
          </Badge>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Event Index</div>
          <Badge variant="outline" className="text-xs font-normal">
            {event.index}
          </Badge>
        </div>
      </div>

      <div className="space-y-3 mt-2">
        {Object.entries(event.data).map(([key, value]) => (
          <div key={key} className="rounded-md overflow-hidden">
            <div className="text-xs text-muted-foreground px-2 py-1 bg-muted/30 border-b flex items-center justify-between">
              <span>{key}</span>
              {typeof value === 'object' && (
                <ExternalLink className="w-3 h-3 opacity-70" />
              )}
            </div>
            <div className={cn(
              'px-2 py-1.5',
              typeof value === 'object' ? 'bg-muted/10' : '',
            )}
            >
              {typeof value === 'object'
                ? (
                    <JsonView
                      data={SuperJSON.serialize(value).json as any}
                      shouldExpandNode={collapseAllNested}
                      style={theme === 'light' ? defaultStyles : darkStyles}
                    />
                  )
                : (
                    <span className="text-sm">{String(value)}</span>
                  )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
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

// Helper function to get edge IDs from event for highlighting
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

// Helper function to determine if an event can highlight nodes/edges
function canHighlight(event: ExecutionEventImpl): boolean {
  return Boolean(getNodeDataFromEvent(event) || getEdgeDataFromEvent(event))
}

// Helper function to format timestamp
function formatTimestamp(timestamp: Date): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// Helper function to get color with opacity
function getColorWithOpacity(colorClass: string, opacity: number): string {
  // Extract color name and weight from Tailwind class
  const [_, color, weight] = colorClass.split('-')
  return `var(--${color}-${weight}, currentColor)`
}
