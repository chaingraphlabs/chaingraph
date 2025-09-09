/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionTreeNode } from '@badaitech/chaingraph-executor/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { AlertCircle, Clock, Copy, ExternalLink, Hash, Layers, Zap } from 'lucide-react'
import { formatDuration, formatTimestamp } from '../utils/formatters'
import { ExecutionStatusIndicator } from './ExecutionStatus'

interface ExecutionDetailsProps {
  execution: ExecutionTreeNode
  onClose: () => void
  className?: string
}

export function ExecutionDetails({ execution: node, onClose, className }: ExecutionDetailsProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Access the actual execution data
  const execution = node.execution
  const nodeId = node.id
  const parentId = node.parentId
  const level = node.level

  // Format timestamps
  const createdAt = execution.createdAt ? new Date(execution.createdAt) : undefined
  const startedAt = execution.startedAt ? new Date(execution.startedAt) : undefined
  const completedAt = execution.completedAt ? new Date(execution.completedAt) : undefined

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Execution Details</h3>
          <div className="flex items-center gap-2">
            <ExecutionStatusIndicator status={execution.status} showLabel />
            {level > 0 && (
              <Badge variant="outline" className="text-xs">
                Level:
                {' '}
                {level}
              </Badge>
            )}
            {execution.executionDepth > 0 && (
              <Badge variant="outline" className="text-xs">
                Depth:
                {' '}
                {execution.executionDepth}
              </Badge>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      <Separator />

      {/* IDs Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Hash className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Execution ID</span>
          </div>
          <div className="flex items-center gap-1">
            <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
              {nodeId}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => copyToClipboard(nodeId)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Flow ID</span>
          </div>
          <div className="flex items-center gap-1">
            <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
              {execution.flowId}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => copyToClipboard(execution.flowId)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {parentId && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Parent ID</span>
            </div>
            <div className="flex items-center gap-1">
              <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                {parentId}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(parentId)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Event Info */}
      {execution.externalEvents && execution.externalEvents.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Zap className="w-4 h-4 text-orange-500" />
              <span>Triggered by Event</span>
            </div>
            <div className="bg-muted/50 rounded-md p-3 space-y-1">
              <div className="text-sm">
                <span className="text-muted-foreground">Event:</span>
                {' '}
                <span className="font-mono">{execution.externalEvents[0].eventName}</span>
              </div>
              {execution.externalEvents[0].payload && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Payload:</span>
                  <pre className="mt-1 text-xs font-mono overflow-x-auto">
                    {JSON.stringify(execution.externalEvents[0].payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Timestamps */}
      <Separator />
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>Timestamps</span>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created</span>
            <span className="font-mono">{createdAt ? formatTimestamp(createdAt) : '-'}</span>
          </div>
          {startedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Started</span>
              <span className="font-mono">{formatTimestamp(startedAt)}</span>
            </div>
          )}
          {completedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Completed</span>
              <span className="font-mono">{formatTimestamp(completedAt)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-mono">
              {formatDuration(startedAt, completedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Error Info */}
      {execution.errorMessage && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>Error</span>
            </div>
            <div className="bg-destructive/10 rounded-md p-3 space-y-1">
              <div className="text-sm text-destructive">{execution.errorMessage}</div>
              {execution.errorNodeId && (
                <div className="text-xs text-muted-foreground">
                  Node ID:
                  {' '}
                  <code className="font-mono">{execution.errorNodeId}</code>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Additional Info */}
      {(execution.rootExecutionId || execution.parentExecutionId) && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="text-sm font-medium">Additional Info</div>
            <div className="space-y-1 text-sm">
              {execution.rootExecutionId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Root Execution</span>
                  <code className="font-mono text-xs">{execution.rootExecutionId}</code>
                </div>
              )}
              {execution.parentExecutionId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Parent Execution</span>
                  <code className="font-mono text-xs">{execution.parentExecutionId}</code>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}