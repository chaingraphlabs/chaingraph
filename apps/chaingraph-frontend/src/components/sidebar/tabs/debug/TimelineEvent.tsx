/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionEventImpl } from '@badaitech/chaingraph-types'
import { ScrollArea } from '@/components/ui'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { ExecutionEventEnum } from '@badaitech/chaingraph-types'
import { ChevronDownIcon, ChevronRightIcon, CodeIcon } from '@radix-ui/react-icons'
import { motion } from 'framer-motion'
import { useState } from 'react'

interface TimelineEventProps {
  event: ExecutionEventImpl
  isGrouped?: boolean
}

export function TimelineEvent({ event, isGrouped = false }: TimelineEventProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const config = getEventConfig(event.type)

  return (
    <div className="relative">
      {/* Timeline Dot */}
      <motion.div
        className={cn(
          'absolute left-[-30px] w-3 h-3 rounded-full',
          'border-2 border-background',
          config.color,
          isGrouped && 'w-2 h-2 left-[-28px]',
        )}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring' }}
      />

      {/* Event Card */}
      <Card
        className={cn(
          'hover:bg-accent/50 transition-colors cursor-pointer',
          isGrouped ? 'py-1.5 px-2' : 'p-2',
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {/* Icon and Label */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-base">{config.icon}</span>
            <CompactEventContent event={event} />
          </div>

          {/* Time and Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary" className="text-[10px] px-1 py-0">
              {new Date(event.timestamp).toLocaleTimeString()}
            </Badge>
            {event.data && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExpanded(!isExpanded)
                }}
              >
                <CodeIcon className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Expanded Content */}
        <Collapsible open={isExpanded}>
          <CollapsibleContent>
            <ScrollArea className="flex-grow overflow-auto">
              <div className="mt-2 pt-2 border-t">
                Detailed event data:
                {/* <DetailedEventContent event={event} /> */}
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  )
}

function CompactEventContent({ event }: { event: ExecutionEventImpl }) {
  switch (event.type) {
    case ExecutionEventEnum.FLOW_STARTED:
      return (
        <span className="text-sm truncate">
          Flow started "
          {(event.data as any).flow.metadata.name}
          "
        </span>
      )

    case ExecutionEventEnum.FLOW_COMPLETED:
      return (
        <span className="text-sm text-green-500 dark:text-green-400 truncate">
          Flow completed in
          {' '}
          {(event.data as any).executionTime}
          ms
        </span>
      )

    case ExecutionEventEnum.NODE_STARTED:
      return (
        <span className="text-sm truncate">
          Node started "
          {(event.data as any).node.metadata.title}
          "
        </span>
      )

    case ExecutionEventEnum.NODE_COMPLETED:
      return (
        <span className="text-sm truncate">
          <span className="text-muted-foreground">
            Node "
            {(event.data as any).node.metadata.title}
            " completed in
          </span>
          {' '}
          {(event.data as any).executionTime}
          ms
        </span>
      )

    case ExecutionEventEnum.NODE_STATUS_CHANGED:
      return (
        <span className="text-sm truncate">
          Node "
          {(event.data as any).node.metadata.title}
          "
          <br />
          {' status changed to '}
          <span className="text-muted-foreground">
            {(event.data as any).newStatus}
          </span>
        </span>
      )

    case ExecutionEventEnum.EDGE_TRANSFER_STARTED: {
      const { edge } = event.data as any

      // debugger
      return (
        <span className="text-sm truncate">
          {edge.sourceNode.metadata.title}
          {' '}
          →
          {edge.targetNode.metadata.title}
        </span>
      )
    }

    case ExecutionEventEnum.DEBUG_BREAKPOINT_HIT:
      return (
        <span className="text-sm text-yellow-500 dark:text-yellow-400 truncate">
          Breakpoint at "
          {(event.data as any).node.metadata.title}
          "
        </span>
      )

    default:
      return (
        <span className="text-sm text-muted-foreground truncate">
          {event.type}
        </span>
      )
  }
}

function DetailedEventContent({ event }: { event: ExecutionEventImpl }) {
  // Detailed content when expanded
  return (
    <div className="space-y-2 text-xs">
      {event.data && (
        <pre className="bg-muted/50 p-2 rounded-md overflow-x-auto">
          {JSON.stringify(event.data, null, 2)}
        </pre>
      )}
    </div>
  )
}

function getEventConfig(type: ExecutionEventEnum) {
  const configs = {
    [ExecutionEventEnum.FLOW_STARTED]: {
      color: 'bg-blue-500',
      icon: '▶️',
    },
    [ExecutionEventEnum.FLOW_COMPLETED]: {
      color: 'bg-green-500',
      icon: '✅',
    },
    [ExecutionEventEnum.FLOW_FAILED]: {
      color: 'bg-red-500',
      icon: '❌',
    },
    [ExecutionEventEnum.NODE_STARTED]: {
      color: 'bg-purple-500',
      icon: '🔄',
    },
    [ExecutionEventEnum.NODE_COMPLETED]: {
      color: 'bg-green-500',
      icon: '✨',
    },
    [ExecutionEventEnum.EDGE_TRANSFER_STARTED]: {
      color: 'bg-blue-400',
      icon: '↗️',
    },
    [ExecutionEventEnum.EDGE_TRANSFER_COMPLETED]: {
      color: 'bg-green-400',
      icon: '✓',
    },
    [ExecutionEventEnum.DEBUG_BREAKPOINT_HIT]: {
      color: 'bg-yellow-500',
      icon: '🔍',
    },
  } as const

  return (configs as any)[type] ?? {
    color: 'bg-gray-500',
    icon: '📝',
  }
}

// Event-specific content components
function FlowStartedContent({ event }: { event: ExecutionEventImpl }) {
  const flow = (event.data as any).flow
  return (
    <div className="space-y-1">
      <div className="text-sm">
        Started flow execution
      </div>
      <div className="flex gap-2">
        <Badge variant="outline" className="text-xs">
          {flow.metadata.name}
        </Badge>
        {flow.metadata.tags?.map((tag: string) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  )
}

function FlowCompletedContent({ event }: { event: ExecutionEventImpl }) {
  const { executionTime } = event.data as any
  return (
    <div className="space-y-1">
      <div className="text-sm text-green-500 dark:text-green-400">
        Flow completed successfully
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Total execution time:</span>
        <Badge variant="outline">
          {executionTime}
          ms
        </Badge>
      </div>
    </div>
  )
}

function NodeStartedContent({ event }: { event: ExecutionEventImpl }) {
  const node = (event.data as any).node
  return (
    <div className="space-y-1">
      <div className="text-sm flex items-center gap-2">
        <span>Started node execution:</span>
        <Badge variant="outline" className="text-xs">
          {node.metadata.title}
        </Badge>
      </div>
      {node.metadata.description && (
        <div className="text-xs text-muted-foreground">
          {node.metadata.description}
        </div>
      )}
    </div>
  )
}

function NodeCompletedContent({ event }: { event: ExecutionEventImpl }) {
  const { node, executionTime } = event.data as any
  return (
    <div className="space-y-1">
      <div className="text-sm flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {node.metadata.title}
        </Badge>
        <span className="text-green-500 dark:text-green-400">completed</span>
        <Badge variant="secondary" className="text-xs">
          {executionTime}
          ms
        </Badge>
      </div>
      <PortsPreview node={node} />
    </div>
  )
}

function NodeFailedContent({ event }: { event: ExecutionEventImpl }) {
  const { node, error } = event.data as any
  return (
    <div className="space-y-1">
      <div className="text-sm flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {node.metadata.title}
        </Badge>
        <span className="text-red-500">failed</span>
      </div>
      <div className="text-xs text-red-500 bg-red-500/10 rounded-md p-2">
        {error.message}
      </div>
    </div>
  )
}

function EdgeTransferStartedContent({ event }: { event: ExecutionEventImpl }) {
  const { edge } = event.data as any
  return (
    <div className="text-sm">
      <div className="flex items-center gap-2">
        <span>Data transfer:</span>
        <Badge variant="outline" className="text-xs">
          {edge.sourceNode.metadata.title}
        </Badge>
        <span>→</span>
        <Badge variant="outline" className="text-xs">
          {edge.targetNode.metadata.title}
        </Badge>
      </div>
    </div>
  )
}

function EdgeTransferCompletedContent({ event }: { event: ExecutionEventImpl }) {
  const { edge, transferTime } = event.data as any
  return (
    <div className="space-y-1">
      <div className="text-sm flex items-center gap-2">
        <span>Transfer completed in</span>
        <Badge variant="secondary" className="text-xs">
          {transferTime}
          ms
        </Badge>
      </div>
    </div>
  )
}

function BreakpointHitContent({ event }: { event: ExecutionEventImpl }) {
  const { node } = event.data as any
  return (
    <div className="space-y-1">
      <div className="text-sm text-yellow-500 dark:text-yellow-400">
        Breakpoint hit at node
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {node.metadata.title}
        </Badge>
      </div>
      <PortsPreview node={node} />
    </div>
  )
}

function PortsPreview({ node }: { node: any }) {
  const [showPorts, setShowPorts] = useState(false)

  return (
    <Collapsible open={showPorts} onOpenChange={setShowPorts}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs p-1 h-auto"
        >
          {showPorts ? 'Hide' : 'Show'}
          {' '}
          ports state
          {showPorts
            ? (
                <ChevronDownIcon className="ml-1 h-3 w-3" />
              )
            : (
                <ChevronRightIcon className="ml-1 h-3 w-3" />
              )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-2">
          <div className="space-y-1">
            <div className="text-xs font-medium">Inputs</div>
            {node.getInputs().map((port: any) => (
              <div key={port.id} className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="min-w-[80px]">
                  {port.title || port.key}
                </Badge>
                <span className="text-muted-foreground">
                  {JSON.stringify(port.getValue())}
                </span>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium">Outputs</div>
            {node.getOutputs().map((port: any) => (
              <div key={port.id} className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="min-w-[80px]">
                  {port.title || port.key}
                </Badge>
                <span className="text-muted-foreground">
                  {JSON.stringify(port.getValue())}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
