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
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight, Zap } from 'lucide-react'
import { memo, useEffect, useState } from 'react'
import { formatDuration, formatEventPayload, formatExecutionId } from '../utils/formatters'
import { ExecutionStatusIndicator } from './ExecutionStatus'

interface ExecutionNodeProps {
  node: ExecutionTreeNode
  depth: number
  onSelect: (node: ExecutionTreeNode) => void
  selectedId?: string
  expandedAll?: boolean
}

export const ExecutionNode = memo(function ExecutionNode({
  node,
  depth,
  onSelect,
  selectedId,
  expandedAll = false,
}: ExecutionNodeProps) {
  const [isExpanded, setIsExpanded] = useState(expandedAll)
  const hasChildren = node.children.length > 0
  const isSelected = selectedId === node.id

  // Update expansion state when expandedAll changes
  useEffect(() => {
    if (hasChildren) {
      setIsExpanded(expandedAll)
    }
  }, [expandedAll, hasChildren])

  // Calculate visual depth with indentation
  const indentWidth = depth * 24

  return (
    <div className="group">
      {/* Node Row */}
      <div
        className={cn(
          'relative flex items-center gap-2 px-2 py-1.5 cursor-pointer transition-all duration-200',
          'hover:bg-accent/50 rounded-sm',
          isSelected && 'bg-accent ring-1 ring-accent-foreground/10',
        )}
        onClick={() => onSelect(node)}
        style={{ paddingLeft: `${indentWidth + 8}px` }}
      >
        {/* Tree Line Connector */}
        {depth > 0 && (
          <div
            className="absolute left-0 top-0 bottom-0 w-px bg-border/50"
            style={{ left: `${indentWidth - 12}px` }}
          />
        )}

        {/* Expand/Collapse Button */}
        {hasChildren
          ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExpanded(!isExpanded)
                }}
              >
                {isExpanded
                  ? (
                      <ChevronDown className="h-3 w-3" />
                    )
                  : (
                      <ChevronRight className="h-3 w-3" />
                    )}
              </Button>
            )
          : (
              <div className="w-5" />
            )}

        {/* Status Icon */}
        <ExecutionStatusIndicator status={node.status} size="sm" />

        {/* Flow Name and ID */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">
              {node.flowName}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatExecutionId(node.id)}
            </span>
          </div>

          {/* Event Trigger Info */}
          {node.triggeredByEvent && (
            <div className="flex items-center gap-1 mt-0.5">
              <Zap className="w-3 h-3 text-orange-500" />
              <span className="text-xs text-muted-foreground">
                {node.triggeredByEvent.eventName}
                {node.triggeredByEvent.payload && (
                  <span className="ml-1 text-muted-foreground/70">
                    (
                    {formatEventPayload(node.triggeredByEvent.payload)}
                    )
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {/* Duration */}
          <span className="font-mono">
            {formatDuration(node.startedAt, node.completedAt)}
          </span>

          {/* Child Count Badge */}
          {hasChildren && (
            <Badge
              variant="secondary"
              className="h-5 px-1.5 text-xs font-mono"
            >
              {node.childCount}
            </Badge>
          )}
        </div>

        {/* Error Indicator */}
        {node.error && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </div>
        )}
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="relative">
          {/* Vertical connector line for children */}
          {node.children.length > 1 && (
            <div
              className="absolute top-0 bottom-4 w-px bg-border/50"
              style={{ left: `${indentWidth + 20}px` }}
            />
          )}

          {node.children.map((child, index) => (
            <div key={child.id} className="relative">
              {/* Horizontal connector to child */}
              <div
                className="absolute top-4 h-px bg-border/50"
                style={{
                  left: `${indentWidth + 20}px`,
                  width: '12px',
                }}
              />

              <ExecutionNode
                node={child}
                depth={depth + 1}
                onSelect={onSelect}
                selectedId={selectedId}
                expandedAll={expandedAll}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
})
