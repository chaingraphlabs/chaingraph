/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionTreeNode } from '@badaitech/chaingraph-executor/types'
import { AlertCircle, Bot, Clock, Copy, ExternalLink, Hash, Layers, Wallet, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
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
  const rootId = execution.rootExecutionId

  // Format timestamps
  const createdAt = execution.createdAt ? new Date(execution.createdAt) : undefined
  const startedAt = execution.startedAt ? new Date(execution.startedAt) : undefined
  const completedAt = execution.completedAt ? new Date(execution.completedAt) : undefined

  return (
    <div className={cn('space-y-4 min-w-0 overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="space-y-1 min-w-0 flex-1">
          <h3 className="text-lg font-semibold truncate">Execution Details</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <ExecutionStatusIndicator status={execution.status} showLabel />
            {execution.executionDepth > 0 && (
              <Badge variant="outline" className="text-xs flex-shrink-0">
                Depth:
                {' '}
                {execution.executionDepth}
              </Badge>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0">
          ✕
        </Button>
      </div>

      <Separator />

      {/* IDs Section */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 text-sm flex-shrink-0">
          <Layers className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground whitespace-nowrap">Flow ID</span>
        </div>
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <code className="text-xs font-mono bg-muted px-2 py-1 rounded truncate block max-w-full">
            {execution.flowId}
          </code>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={() => copyToClipboard(execution.flowId)}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 text-sm flex-shrink-0">
            <Hash className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground whitespace-nowrap">Execution ID</span>
          </div>
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <code className="text-xs font-mono bg-muted px-2 py-1 rounded truncate block max-w-full">
              {nodeId}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={() => copyToClipboard(nodeId)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {parentId && (
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 text-sm flex-shrink-0">
              <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground whitespace-nowrap">Parent ID</span>
            </div>
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <code className="text-xs font-mono bg-muted px-2 py-1 rounded truncate block max-w-full">
                {parentId}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={() => copyToClipboard(parentId)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {rootId && (
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 text-sm flex-shrink-0">
              <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground whitespace-nowrap">Root ID</span>
            </div>
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <code className="text-xs font-mono bg-muted px-2 py-1 rounded truncate block max-w-full">
                {rootId}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={() => copyToClipboard(rootId)}
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
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Zap className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <span>Triggered by Event</span>
            </div>
            <div className="bg-muted/50 rounded-md p-3 space-y-1 min-w-0">
              <div className="text-sm min-w-0">
                <span className="text-muted-foreground">Event:</span>
                {' '}
                <span className="font-mono truncate inline-block max-w-full align-bottom">{execution.externalEvents[0].eventName}</span>
              </div>
              {execution.externalEvents[0].payload && (
                <div className="text-sm min-w-0">
                  <span className="text-muted-foreground">Payload:</span>
                  <pre className="mt-1 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all max-w-full">
                    {JSON.stringify(execution.externalEvents[0].payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Integration Info */}
      {execution.integration && (
        <>
          <Separator />
          <div className="space-y-3 min-w-0">
            {execution.integration?.archai && (
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Bot className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>ArchAI Integration</span>
                </div>
                <div className="bg-muted/50 rounded-md p-3 space-y-2 min-w-0">
                  {execution.integration.archai.agentID && (
                    <div className="flex items-center justify-between gap-2 text-sm min-w-0">
                      <span className="text-muted-foreground flex-shrink-0 whitespace-nowrap">Agent ID</span>
                      <code className="font-mono text-xs bg-muted px-2 py-0.5 rounded truncate max-w-full">
                        {execution.integration.archai.agentID}
                      </code>
                    </div>
                  )}
                  {execution.integration.archai.chatID && (
                    <div className="flex items-center justify-between gap-2 text-sm min-w-0">
                      <span className="text-muted-foreground flex-shrink-0 whitespace-nowrap">Chat ID</span>
                      <code className="font-mono text-xs bg-muted px-2 py-0.5 rounded truncate max-w-full">
                        {execution.integration.archai.chatID}
                      </code>
                    </div>
                  )}
                  {execution.integration.archai.messageID !== undefined && (
                    <div className="flex items-center justify-between gap-2 text-sm min-w-0">
                      <span className="text-muted-foreground flex-shrink-0 whitespace-nowrap">Message ID</span>
                      <code className="font-mono text-xs bg-muted px-2 py-0.5 rounded truncate max-w-full">
                        {execution.integration.archai.messageID}
                      </code>
                    </div>
                  )}
                  {!execution.integration.archai.agentID && !execution.integration.archai.chatID && !execution.integration.archai.messageID && (
                    <div className="text-sm text-muted-foreground">No context available</div>
                  )}
                </div>
              </div>
            )}

            {execution.integration?.wallet && (
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Wallet className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <span>Wallet Integration</span>
                  {execution.integration.wallet.isConnected && (
                    <Badge variant="outline" className="text-xs">
                      Connected
                    </Badge>
                  )}
                </div>
                <div className="bg-muted/50 rounded-md p-3 space-y-2 min-w-0">
                  {execution.integration.wallet.address && (
                    <div className="flex items-center justify-between gap-2 text-sm min-w-0">
                      <span className="text-muted-foreground flex-shrink-0 whitespace-nowrap">Address</span>
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        <code className="font-mono text-xs bg-muted px-2 py-0.5 rounded truncate block max-w-full">
                          {execution.integration.wallet.address.slice(0, 6)}
                          ...
                          {execution.integration.wallet.address.slice(-4)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={() => copyToClipboard(execution.integration?.wallet?.address || '')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {execution.integration.wallet.chainId && (
                    <div className="flex items-center justify-between gap-2 text-sm min-w-0">
                      <span className="text-muted-foreground flex-shrink-0 whitespace-nowrap">Chain ID</span>
                      <code className="font-mono text-xs bg-muted px-2 py-0.5 rounded truncate max-w-full">
                        {execution.integration.wallet.chainId}
                      </code>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2 text-sm min-w-0">
                    <span className="text-muted-foreground flex-shrink-0">Status</span>
                    <span className="text-xs">
                      {execution.integration.wallet.isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Timestamps */}
      <Separator />
      <div className="space-y-2 min-w-0">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span>Timestamps</span>
        </div>
        <div className="space-y-1 text-sm min-w-0">
          <div className="flex justify-between gap-2 min-w-0">
            <span className="text-muted-foreground flex-shrink-0">Created</span>
            <span className="font-mono truncate">{createdAt ? formatTimestamp(createdAt) : '-'}</span>
          </div>
          {startedAt && (
            <div className="flex justify-between gap-2 min-w-0">
              <span className="text-muted-foreground flex-shrink-0">Started</span>
              <span className="font-mono truncate">{formatTimestamp(startedAt)}</span>
            </div>
          )}
          {completedAt && (
            <div className="flex justify-between gap-2 min-w-0">
              <span className="text-muted-foreground flex-shrink-0">Completed</span>
              <span className="font-mono truncate">{formatTimestamp(completedAt)}</span>
            </div>
          )}
          <div className="flex justify-between gap-2 min-w-0">
            <span className="text-muted-foreground flex-shrink-0">Duration</span>
            <span className="font-mono truncate">
              {formatDuration(startedAt, completedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Error Info */}
      {execution.errorMessage && (
        <>
          <Separator />
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Error</span>
            </div>
            <div className="bg-destructive/10 rounded-md p-3 space-y-1 min-w-0">
              <div className="text-sm text-destructive break-words">{execution.errorMessage}</div>
              {execution.errorNodeId && (
                <div className="text-xs text-muted-foreground min-w-0">
                  Node ID:
                  {' '}
                  <code className="font-mono truncate inline-block max-w-full align-bottom">{execution.errorNodeId}</code>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
