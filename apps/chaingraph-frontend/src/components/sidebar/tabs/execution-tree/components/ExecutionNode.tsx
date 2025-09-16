/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionTreeNode, RootExecution } from '@badaitech/chaingraph-executor/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight, Loader2, Zap } from 'lucide-react'
import { memo, useEffect, useState } from 'react'
import { formatDuration, formatExecutionId } from '../utils/formatters'
import { ExecutionStatusIndicator } from './ExecutionStatus'

interface ExecutionNodeProps {
  // Either a root execution or a tree node
  node: RootExecution | ExecutionTreeNode
  isRoot?: boolean
  depth: number
  // For root nodes, these come from the parent
  hasChildren?: boolean
  isExpanded?: boolean
  isLoading?: boolean
  children?: ExecutionTreeNode[]
  // Callbacks
  onSelect: (nodeId: string) => void
  onExpand?: (nodeId: string) => void
  onCollapse?: (nodeId: string) => void
  selectedId?: string
  expandedAll?: boolean
}

export const ExecutionNode = memo(function ExecutionNode({
  node,
  isRoot = false,
  depth,
  hasChildren: hasChildrenProp,
  isExpanded: isExpandedProp,
  isLoading,
  children = [],
  onSelect,
  onExpand,
  onCollapse,
  selectedId,
  expandedAll = false,
}: ExecutionNodeProps) {
  // Determine execution data based on node type
  const execution = isRoot ? (node as RootExecution).execution : (node as ExecutionTreeNode).execution
  const executionId = isRoot ? execution.id : (node as ExecutionTreeNode).id

  // For root nodes, use prop values; for tree nodes, check children array
  const hasChildren = isRoot
    ? hasChildrenProp || false
    : children.length > 0

  // Local expansion state for tree nodes (root nodes are controlled by parent)
  const [localExpanded, setLocalExpanded] = useState(expandedAll)

  const isExpanded = isRoot ? isExpandedProp : localExpanded
  const isSelected = selectedId === executionId

  // Update local expansion state when expandedAll changes (for tree nodes)
  useEffect(() => {
    if (!isRoot && hasChildren) {
      setLocalExpanded(expandedAll)
    }
  }, [expandedAll, hasChildren, isRoot])

  // Calculate visual depth with indentation
  const indentWidth = depth * 24

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (isRoot) {
      // For root nodes, use the expand/collapse callbacks
      if (isExpanded && onCollapse) {
        onCollapse(executionId)
      } else if (!isExpanded && onExpand) {
        onExpand(executionId)
      }
    } else {
      // For tree nodes, toggle local state
      setLocalExpanded(!localExpanded)
    }
  }

  // Build tree structure for nested nodes
  // const buildChildTree = (treeNodes: ExecutionTreeNode[], parentId: string): ExecutionTreeNode[] => {
  //   return treeNodes.filter(n => n.parentId === parentId)
  // }
  const buildChildTree = (treeNodes: ExecutionTreeNode[], parentLevel: number): ExecutionTreeNode[] => {
    return treeNodes.filter(n => n.level > parentLevel)
  }

  const renderChildren = () => {
    if (!isExpanded || !hasChildren)
      return null

    if (isLoading) {
      return (
        <div className="ml-6 py-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading execution tree...
        </div>
      )
    }

    if (isRoot) {
      // For root nodes, render the fetched tree
      const rootChildren = children.filter(n => n.parentId === executionId)
      return rootChildren.map(child => (
        <ExecutionNode
          key={child.id}
          node={child}
          isRoot={false}
          depth={depth + 1}
          children={buildChildTree(children, child.level)}
          onSelect={onSelect}
          selectedId={selectedId}
          expandedAll={expandedAll}
        />
      ))
    } else {
      // For tree nodes, render their children
      return children
        .filter(n => n.parentId === executionId)
        .map(child => (
          <ExecutionNode
            key={child.id}
            node={child}
            isRoot={false}
            depth={depth + 1}
            children={buildChildTree(children, child.level)}
            onSelect={onSelect}
            selectedId={selectedId}
            expandedAll={expandedAll}
          />
        ))
    }
  }

  // Get status from execution
  const status = execution.status

  // Format timestamps
  const startedAt = execution.startedAt ? new Date(execution.startedAt) : undefined
  const completedAt = execution.completedAt ? new Date(execution.completedAt) : undefined

  return (
    <div className="group">
      {/* Node Row */}
      <div
        className={cn(
          'relative flex items-center gap-2 px-2 py-1.5 cursor-pointer transition-all duration-200',
          'hover:bg-accent/50 rounded-sm',
          isSelected && 'bg-accent ring-1 ring-accent-foreground/10',
        )}
        onClick={() => onSelect(executionId)}
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
                onClick={handleToggleExpand}
              >
                {isLoading
                  ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    )
                  : isExpanded
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
        <ExecutionStatusIndicator status={status} size="sm" />

        {/* Flow Name and ID */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">
              Flow Execution
            </span>
            <span className="text-xs text-muted-foreground">
              {formatExecutionId(executionId)}
            </span>
          </div>

          {/* External Events Info (if available) */}
          {execution.externalEvents && execution.externalEvents.length > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
              <Zap className="w-3 h-3 text-orange-500" />
              <span className="text-xs text-muted-foreground">
                {execution.externalEvents[0].eventName}
              </span>
            </div>
          )}
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {/* Duration */}
          {startedAt && completedAt && (
            <span className="font-mono">
              {formatDuration(startedAt, completedAt)}
            </span>
          )}

          <span className="font-mono">
            {(node as RootExecution).execution.executionDepth}
          </span>

          {/* Child Count Badge (for root nodes with statistics) */}
          {isRoot && (node as RootExecution).totalNested > 1 && (
            <Badge
              variant="secondary"
              className="h-5 px-1.5 text-xs font-mono"
            >
              {(node as RootExecution).totalNested - 1}
            </Badge>
          )}

          {/* Depth Badge (for root nodes with levels) */}
          {/* {isRoot && (node as RootExecution).levels > 0 && ( */}
          {/*  <Badge */}
          {/*    variant="outline" */}
          {/*    className="h-5 px-1.5 text-xs font-mono" */}
          {/*  > */}
          {/*    Levels: */}
          {/*    {(node as RootExecution).levels} */}
          {/*  </Badge> */}
          {/* )} */}
        </div>

        {/* Error Indicator */}
        {execution.errorMessage && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </div>
        )}
      </div>

      {/* Children */}
      {renderChildren()}
    </div>
  )
})
