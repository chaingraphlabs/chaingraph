/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionTreeNode } from '../utils/tree-builder'
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

export function ExecutionDetails({ execution, onClose, className }: ExecutionDetailsProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{execution.flowName}</h3>
          <div className="flex items-center gap-2">
            <ExecutionStatusIndicator status={execution.status} showLabel />
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
              {execution.id}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => copyToClipboard(execution.id)}
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

        {execution.parentExecutionId && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Parent ID</span>
            </div>
            <div className="flex items-center gap-1">
              <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                {execution.parentExecutionId}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(execution.parentExecutionId!)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Trigger Event */}
      {execution.triggeredByEvent && (
        <>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Zap className="w-4 h-4 text-orange-500" />
              Triggered by Event
            </div>
            <div className="bg-muted/50 rounded-md p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Event Name</span>
                <Badge variant="secondary">{execution.triggeredByEvent.eventName}</Badge>
              </div>
              {execution.triggeredByEvent.payload && (
                <div className="mt-2">
                  <span className="text-xs text-muted-foreground">Payload</span>
                  <pre className="mt-1 text-xs font-mono bg-background rounded p-2 overflow-auto max-h-32">
                    {JSON.stringify(execution.triggeredByEvent.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Timing Information */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Clock className="w-4 h-4 text-muted-foreground" />
          Timing
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Created</span>
            <div className="font-mono text-xs mt-1">
              {formatTimestamp(execution.createdAt)}
            </div>
          </div>

          {execution.startedAt && (
            <div>
              <span className="text-muted-foreground">Started</span>
              <div className="font-mono text-xs mt-1">
                {formatTimestamp(execution.startedAt)}
              </div>
            </div>
          )}

          {execution.completedAt && (
            <div>
              <span className="text-muted-foreground">Completed</span>
              <div className="font-mono text-xs mt-1">
                {formatTimestamp(execution.completedAt)}
              </div>
            </div>
          )}

          <div>
            <span className="text-muted-foreground">Duration</span>
            <div className="font-mono text-xs mt-1">
              {formatDuration(execution.startedAt, execution.completedAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Error Information */}
      {execution.error && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-red-500">
              <AlertCircle className="w-4 h-4" />
              Error
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
              <p className="text-sm text-red-600 dark:text-red-400">
                {execution.error.message}
              </p>
              {execution.error.nodeId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Node:
                  {' '}
                  {execution.error.nodeId}
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Statistics */}
      {execution.childCount > 0 && (
        <>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Child Executions</span>
            <Badge>{execution.childCount}</Badge>
          </div>
        </>
      )}
    </div>
  )
}
