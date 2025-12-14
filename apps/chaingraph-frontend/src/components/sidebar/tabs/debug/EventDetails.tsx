/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionEventData, ExecutionEventImpl } from '@badaitech/chaingraph-types'
import { ExecutionEventEnum } from '@badaitech/chaingraph-types'
import React, { memo } from 'react'
import SuperJSON from 'superjson'
import { formatValue } from '@/components/flow/nodes/ChaingraphNode/ports/doc'
import { useTheme } from '@/components/theme/hooks/useTheme'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import 'react-json-view-lite/dist/index.css'
import './style/json.css'

function serializeEvent(event: ExecutionEventImpl) {
  switch (event.type) {
    case ExecutionEventEnum.NODE_STARTED:
    case ExecutionEventEnum.NODE_FAILED:
    case ExecutionEventEnum.NODE_COMPLETED:
    case ExecutionEventEnum.DEBUG_BREAKPOINT_HIT:
    {
      const data = event.data as ExecutionEventData[ExecutionEventEnum.NODE_COMPLETED]
      const node = data.node

      const portsToRender = Array.from(node.ports.values()).filter((port) => {
        if (port.isSystem()) {
          return false
        }

        return true
      })

      const serializedPorts = portsToRender.map((port) => {
        return port.serialize() as any
      })

      return (
        <div>
          <div className="text-xs text-muted-foreground mt-1">
            <div>Node ports:</div>
            <div className="text-xs text-muted-foreground mt-1">
              <ScrollArea className="flex-grow overflow-scroll max-h-[350px] ">
                {serializedPorts.map((port) => {
                  return (
                    <div
                      key={port.id}
                      className={cn(
                        'p-2',
                      )}
                    >
                      <div className={
                        cn(
                          'flex items-center justify-start gap-1 mb-1',
                        )
                      }
                      >
                        {/* small circle with background color */}
                        <div
                          className={cn(
                            'inline-block w-2 h-2 rounded-full mr-1',
                          )}
                          style={{
                            backgroundColor: port.config.ui?.bgColor ?? '#d3d3d3',
                          }}
                        />

                        <span className="text-xs text-muted-foreground">
                          {port.config.title
                            ? `${port.config.title} (${port.config.key})`
                            : port.config.key}
                        </span>
                      </div>

                      <pre className="text-sm font-mono bg-muted/10 p-2 rounded border overflow-auto whitespace-pre-wrap break-all">
                        {
                          port.config.type === 'string' && port.config?.ui?.isPassword === true
                            ? '**** hidden ****'
                            : formatValue(port.value)
                        }
                      </pre>
                    </div>
                  )
                })}
              </ScrollArea>
            </div>
          </div>
        </div>
      )
    }

    case ExecutionEventEnum.NODE_SKIPPED:
    case ExecutionEventEnum.NODE_STATUS_CHANGED:
    case ExecutionEventEnum.NODE_DEBUG_LOG_STRING:
    {
      const data = event.data as ExecutionEventData[ExecutionEventEnum.NODE_DEBUG_LOG_STRING]
      const node = data.nodeId

      return (
        <div className="p-2">
          <div className="text-sm font-medium">{node}</div>
          <pre className="text-sm font-mono bg-muted/10 p-2 rounded border overflow-auto max-h-[350px] whitespace-pre-wrap break-all">
            {data.log}
          </pre>
        </div>
      )
    }

    case ExecutionEventEnum.CHILD_EXECUTION_SPAWNED:
    case ExecutionEventEnum.CHILD_EXECUTION_COMPLETED:
    case ExecutionEventEnum.CHILD_EXECUTION_FAILED:
    {
      const data = event.data as ExecutionEventData[ExecutionEventEnum.CHILD_EXECUTION_SPAWNED]

      return (
        <div className="p-2 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Event Name</div>
              <Badge variant="secondary">{data.eventName}</Badge>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Child Execution ID</div>
              <Badge variant="outline" className="text-xs font-mono">
                {data.childExecutionId}
              </Badge>
            </div>
          </div>

          {data.eventData && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Event Data</div>
              <pre className="text-sm font-mono bg-muted/10 p-2 rounded border overflow-auto max-h-[200px] whitespace-pre-wrap break-all">
                {JSON.stringify(data.eventData, null, 2)}
              </pre>
            </div>
          )}

          {event.type === ExecutionEventEnum.CHILD_EXECUTION_FAILED && (data as any).error && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Error</div>
              <Badge variant="destructive" className="text-xs">
                {(data as any).error.message}
              </Badge>
            </div>
          )}
        </div>
      )
    }

    case ExecutionEventEnum.EDGE_TRANSFER_STARTED:
    case ExecutionEventEnum.EDGE_TRANSFER_COMPLETED:
    case ExecutionEventEnum.EDGE_TRANSFER_FAILED:
    {
      const data = event.data as ExecutionEventData[ExecutionEventEnum.EDGE_TRANSFER_COMPLETED]
      const edge = data.serializedEdge

      return (
        <div className="p-2">
          <div className="flex flex-col gap-3">

            {/* Connection visualization */}
            <div className="flex items-center justify-between gap-2 bg-muted/20 p-3 rounded-md border">
              {/* Source node and port */}
              <div className="flex-1 bg-muted/30 p-2 rounded-md border">
                <div className="text-sm font-medium">{edge.sourceNodeId}</div>
                <div className="flex items-center mt-1 gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    // style={{ backgroundColor: edge.sourcePort.getConfig()?.ui?.bgColor ?? '#d3d3d3' }}
                  />
                  <span className="text-xs">{edge.sourcePortId}</span>
                </div>
              </div>

              {/* Connection arrow */}
              <div className="flex flex-col items-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Target node and port */}
              <div className="flex-1 bg-muted/30 p-2 rounded-md border">
                <div className="text-sm font-medium">{edge.targetNodeId}</div>
                <div className="flex items-center mt-1 gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    // style={{ backgroundColor: edge.targetPort.getConfig()?.ui?.bgColor ?? '#d3d3d3' }}
                  />
                  <span className="text-xs">{edge.targetPortId}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="text-sm font-medium">
      <pre className="text-sm font-mono bg-muted/10 p-2 rounded border overflow-auto max-h-[350px] whitespace-pre-wrap break-all">
        {JSON.stringify(SuperJSON.serialize(event.data).json, null, 2)}
      </pre>
    </div>
  )
}

export const EventDetails = memo(({ event, isVisible }: { event: ExecutionEventImpl, isVisible: boolean }) => {
  const { theme } = useTheme()

  // Only process data if details are visible
  if (!isVisible)
    return null

  return (
    <div className="space-y-3 w-full">
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
        <ScrollArea className="flex-grow overflow-scroll">
          {serializeEvent(event)}
        </ScrollArea>
      </div>
    </div>
  )
})

EventDetails.displayName = 'EventDetails'
