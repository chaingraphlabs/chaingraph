/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionEventImpl } from '@badaitech/chaingraph-types'
import { Badge } from '@/components/ui/badge'
import { ExecutionEventEnum } from '@badaitech/chaingraph-types'
import { AlertCircle, ArrowRightCircle, Timer } from 'lucide-react'
import React, { memo, useMemo } from 'react'
import 'react-json-view-lite/dist/index.css'
import './style/json.css'

export const EventTitle = memo(({ event }: { event: ExecutionEventImpl }) => {
  const titleContent = useMemo(() => {
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

      case ExecutionEventEnum.NODE_DEBUG_LOG_STRING:
        return (
          <div className="text-sm space-y-1 w-full">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="font-medium truncate max-w-full">
                Log from "
                {(event.data as any).node.metadata.title}
                "
              </span>
            </div>
            <div className="font-mono text-xs bg-muted/30 p-2 rounded border overflow-auto max-h-[120px] whitespace-pre-wrap break-all w-full">
              {(event.data as any).log}
            </div>
          </div>
        )

      // Child Execution Events
      case ExecutionEventEnum.CHILD_EXECUTION_SPAWNED:
        return (
          <div className="text-sm space-y-1">
            <div>Child execution spawned</div>
            <Badge variant="secondary" className="text-xs font-normal">
              Event: {(event.data as any).eventName}
            </Badge>
          </div>
        )

      case ExecutionEventEnum.CHILD_EXECUTION_COMPLETED:
        return (
          <div className="text-sm space-y-1">
            <div>Child execution completed</div>
            <Badge variant="outline" className="text-xs font-normal">
              Event: {(event.data as any).eventName}
            </Badge>
          </div>
        )

      case ExecutionEventEnum.CHILD_EXECUTION_FAILED:
        return (
          <div className="text-sm space-y-1">
            <div>Child execution failed</div>
            <Badge variant="destructive" className="text-xs font-normal">
              <AlertCircle className="w-3 h-3 mr-1" />
              Event: {(event.data as any).eventName}
            </Badge>
          </div>
        )

      default:
        return <span className="text-sm text-muted-foreground">{event.type}</span>
    }
  }, [event])

  return titleContent
})
EventTitle.displayName = 'EventTitle'
