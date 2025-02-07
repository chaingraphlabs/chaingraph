import { eventThemes } from '@/components/sidebar/tabs/debug/theme.ts'
import { useTheme } from '@/components/theme/hooks/useTheme.ts'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Badge } from '@badaitech/chaingraph-frontend/components/ui/badge'
import { ExecutionEventEnum, type ExecutionEventImpl } from '@badaitech/chaingraph-types'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowRightCircle, ChevronDownIcon, Timer } from 'lucide-react'
import React, { Fragment, useState } from 'react'
import {
  collapseAllNested,
  darkStyles,
  defaultStyles,
  JsonView,
} from 'react-json-view-lite'
import 'react-json-view-lite/dist/index.css'

interface EventCardProps {
  event: ExecutionEventImpl
  index: number
}

export function EventCard({ event, index }: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { theme: themeMode } = useTheme()
  const eventTheme = eventThemes[event.type]

  // Helper function to convert a Tailwind color class to a CSS variable
  const getColorFromTheme = (colorClass: string) => {
    // Extract color name and weight from Tailwind class
    const [_, color, weight] = colorClass.split('-')
    return `var(--${color}-${weight})`
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-200',
          'hover:shadow-md dark:hover:shadow-accent/10',
          'border dark:border-border/50',
          isExpanded ? 'mb-2' : 'mb-1',
        )}
      >
        {/* Color indicator strip */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{
            backgroundColor: getColorFromTheme(
              themeMode === 'dark'
                ? eventTheme.color.dark
                : eventTheme.color.light,
            ),
          }}
        />

        <div className="p-3 pl-5">
          {/* Header - clicking here toggles expansion */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <eventTheme.icon
              className={cn(
                'w-4 h-4',
                themeMode === 'dark' ? eventTheme.color.dark : eventTheme.color.light,
              )}
            />
            <div className="flex-1 min-w-0">
              <EventTitle event={event} />
            </div>
            <time className="text-xs text-muted-foreground">
              {new Date(event.timestamp).toLocaleTimeString()}
            </time>
            <ChevronDownIcon
              className={cn('w-4 h-4 transition-transform', isExpanded ? 'rotate-180' : '')}
            />
          </div>

          {/* Expanded content */}
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              className="mt-2 pt-2 border-t dark:border-border/50"
            >
              <EventDetails event={event} />
            </motion.div>
          )}
        </div>

        {/* Hover state background - pointer-events disabled so as not to block clicks */}
        <div
          className={cn(
            'absolute inset-0 opacity-0 transition-opacity duration-200 pointer-events-none',
            'hover:opacity-5 dark:hover:opacity-10',
            themeMode === 'dark' ? eventTheme.bgColor.dark : eventTheme.bgColor.light,
          )}
        />
      </Card>
    </motion.div>
  )
}

function EventTitle({ event }: { event: ExecutionEventImpl }) {
  switch (event.type) {
    // Flow Events
    case ExecutionEventEnum.FLOW_SUBSCRIBED:
      return (
        <span>
          Subscribed to flow "
          {(event.data as any).flow.metadata.name}
          "
        </span>
      )

    case ExecutionEventEnum.FLOW_STARTED:
      return (
        <span>
          Flow started "
          {(event.data as any).flow.metadata.name}
          "
        </span>
      )

    case ExecutionEventEnum.FLOW_COMPLETED:
      return (
        <span className="flex items-center gap-2">
          Flow completed
          <Badge variant="secondary" className="text-xs">
            <Timer className="w-3 h-3 mr-1" />
            {(event.data as any).executionTime}
            ms
          </Badge>
        </span>
      )

    case ExecutionEventEnum.FLOW_FAILED:
      return (
        <span className="flex items-center gap-2">
          Flow failed
          <Badge variant="destructive" className="text-xs">
            {(event.data as any).error.message}
          </Badge>
        </span>
      )

    case ExecutionEventEnum.FLOW_CANCELLED:
      return (
        <span className="flex items-center gap-2">
          Flow cancelled
          <Badge variant="secondary" className="text-xs">
            {(event.data as any).reason}
          </Badge>
        </span>
      )

    case ExecutionEventEnum.FLOW_PAUSED:
      return (
        <span className="flex items-center gap-2">
          Flow paused
          <Badge variant="secondary" className="text-xs">
            {(event.data as any).reason}
          </Badge>
        </span>
      )

    case ExecutionEventEnum.FLOW_RESUMED:
      return <span>Flow resumed</span>

    // Node Events
    case ExecutionEventEnum.NODE_STARTED:
      return (
        <span>
          Node "
          {(event.data as any).node.metadata.title}
          " started
        </span>
      )

    case ExecutionEventEnum.NODE_COMPLETED:
      return (
        <span className="flex items-center gap-2">
          Node "
          {(event.data as any).node.metadata.title}
          " completed
          <Badge variant="secondary" className="text-xs">
            <Timer className="w-3 h-3 mr-1" />
            {(event.data as any).executionTime}
            ms
          </Badge>
        </span>
      )

    case ExecutionEventEnum.NODE_FAILED:
      return (
        <span className="flex items-center gap-2">
          Node "
          {(event.data as any).node.metadata.title}
          " failed
          <Badge variant="destructive" className="text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {(event.data as any).error.message}
          </Badge>
        </span>
      )

    case ExecutionEventEnum.NODE_SKIPPED:
      return (
        <span className="flex items-center gap-2">
          Node "
          {(event.data as any).node.metadata.title}
          " skipped
          <Badge variant="secondary" className="text-xs">
            {(event.data as any).reason}
          </Badge>
        </span>
      )

    case ExecutionEventEnum.NODE_STATUS_CHANGED:
      return (
        <span className="flex items-center gap-2">
          Node "
          {(event.data as any).node.metadata.title}
          " status changed
          <Badge variant="outline" className="text-xs">
            {(event.data as any).oldStatus}
          </Badge>
          <ArrowRightCircle className="w-3 h-3" />
          <Badge variant="secondary" className="text-xs">
            {(event.data as any).newStatus}
          </Badge>
        </span>
      )

    // Edge Events
    case ExecutionEventEnum.EDGE_TRANSFER_STARTED: {
      const edge = (event.data as any).edge
      return (
        <span className="flex items-center gap-1">
          {edge.sourceNode.metadata.title}
          <ArrowRightCircle className="w-3 h-3" />
          {edge.targetNode.metadata.title}
        </span>
      )
    }

    case ExecutionEventEnum.EDGE_TRANSFER_COMPLETED: {
      const edge = (event.data as any).edge
      return (
        <span className="flex items-center gap-2">
          Transfer completed
          <Badge variant="secondary" className="text-xs">
            <Timer className="w-3 h-3 mr-1" />
            {(event.data as any).transferTime}
            ms
          </Badge>
        </span>
      )
    }

    case ExecutionEventEnum.EDGE_TRANSFER_FAILED: {
      const edge = (event.data as any).edge
      return (
        <span className="flex items-center gap-2">
          Transfer failed
          <Badge variant="destructive" className="text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {(event.data as any).error.message}
          </Badge>
        </span>
      )
    }

    // Debug Events
    case ExecutionEventEnum.DEBUG_BREAKPOINT_HIT:
      return (
        <span>
          Breakpoint hit at node "
          {(event.data as any).node.metadata.title}
          "
        </span>
      )

    default:
      return <span>{event.type}</span>
  }
}

function EventDetails({ event }: { event: ExecutionEventImpl }) {
  const { theme } = useTheme()

  return (
    <div className="text-sm space-y-4 width-[calc(100%-1rem)]">
      <div>
        <div className="text-muted-foreground mb-1">Event Type</div>
        <div>{event.type}</div>
      </div>
      <div>
        <div className="text-muted-foreground mb-1">Index</div>
        <div>{event.index}</div>
      </div>
      {Object.entries(event.data).map(([key, value]) => (
        <div key={key}>
          <div className="text-muted-foreground mb-1">{key}</div>
          <div>
            {typeof value === 'object'
              ? (
                  <Fragment>
                    <JsonView
                      data={value}
                      shouldExpandNode={collapseAllNested}
                      clickToExpandNode
                      style={theme === 'light' ? defaultStyles : darkStyles}
                    />
                  </Fragment>
                )
              : (
                  String(value)
                )}
          </div>
        </div>
      ))}
    </div>
  )
}
