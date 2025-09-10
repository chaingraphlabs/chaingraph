/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { RootExecution } from '@badaitech/chaingraph-executor/types'
import type { ExecutionStatus } from '@badaitech/chaingraph-executor/types'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { $executionId, setExecutionIdAndReset } from '@/store/execution'
import { useExecutionTree, useSelectedExecution } from '@/store/execution-tree/hooks/useExecutionTree'
import { $activeFlowId } from '@/store/flow/stores'
import { useUnit } from 'effector-react'
import { useState } from 'react'
import { EmptyState } from './components/EmptyState'
import { ExecutionDetails } from './components/ExecutionDetails'
import { ExecutionNode } from './components/ExecutionNode'
import { TreeControls } from './components/TreeControls'

export function ExecutionTree() {
  const {
    rootExecutions,
    isLoadingRoots,
    isTreeLoading,
    error,
    filters,
    updateFilters,
    handleExpand,
    handleCollapse,
    getExecutionTree,
    isExpanded,
    refetch,
  } = useExecutionTree()

  const { selectedExecution, selectExecution } = useSelectedExecution()

  // Get active flow ID to check if a flow is selected
  const activeFlowId = useUnit($activeFlowId)
  // Get current execution ID from execution store
  const currentExecutionId = useUnit($executionId)

  // UI State
  const [expandedAll, setExpandedAll] = useState(false)

  const handleRefresh = () => {
    refetch()
  }

  // Update filters
  const handleStatusFilterChange = (status: ExecutionStatus | 'all') => {
    updateFilters({ status })
  }

  const handleSearchChange = (searchQuery: string) => {
    updateFilters({ searchQuery })
  }

  const handleToggleExpandAll = () => {
    if (!expandedAll) {
      // Expand all root executions that have children
      rootExecutions.forEach((rootExec) => {
        if ((rootExec.levels > 0 || rootExec.totalNested > 0) && !isExpanded(rootExec.execution.id)) {
          handleExpand(rootExec.execution.id)
        }
      })
    } else {
      // Collapse all
      rootExecutions.forEach((rootExec) => {
        if (isExpanded(rootExec.execution.id)) {
          handleCollapse(rootExec.execution.id)
        }
      })
    }
    setExpandedAll(!expandedAll)
  }

  const handleNodeSelect = (nodeId: string) => {
    selectExecution(nodeId)

    // Only reset stores if switching to a different execution
    // This prevents clearing stores when clicking the same execution twice
    if (currentExecutionId !== nodeId) {
      setExecutionIdAndReset(nodeId)
    }
    // If it's the same execution, do nothing - keep the current state
  }

  const renderRootExecution = (rootExec: RootExecution) => {
    const hasChildren = rootExec.levels > 1 || rootExec.totalNested > 1
    const expanded = isExpanded(rootExec.execution.id)
    const loading = isTreeLoading(rootExec.execution.id)
    const tree = getExecutionTree(rootExec.execution.id)

    return (
      <ExecutionNode
        key={rootExec.execution.id}
        node={rootExec}
        isRoot
        depth={0}
        hasChildren={hasChildren}
        isExpanded={expanded}
        isLoading={loading}
        children={tree}
        onSelect={handleNodeSelect}
        onExpand={handleExpand}
        onCollapse={handleCollapse}
        selectedId={selectedExecution?.id}
        expandedAll={expandedAll}
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="px-4 py-3">
        <TreeControls
          searchQuery={filters.searchQuery}
          onSearchChange={handleSearchChange}
          statusFilter={filters.status}
          onStatusFilterChange={handleStatusFilterChange}
          expandedAll={expandedAll}
          onToggleExpandAll={handleToggleExpandAll}
          onRefresh={handleRefresh}
        />
      </div>

      <Separator />

      {/* Tree Content */}
      <div className="flex-1 min-h-0 flex flex-col">
        <ScrollArea className="flex-1">
          <div className="py-2">
            {!activeFlowId
              ? (
                  // No flow selected state
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-muted-foreground mb-2">No flow selected</p>
                    <p className="text-xs text-muted-foreground">
                      Select a flow from the Flows tab to view its executions
                    </p>
                  </div>
                )
              : isLoadingRoots
                ? (
                    // Loading state
                    <div className="space-y-2 px-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-10 w-full" />
                          {i % 2 === 0 && (
                            <div className="ml-6">
                              <Skeleton className="h-8 w-[95%]" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                : error
                  ? (
                      // Error state
                      <div className="px-4 py-8 text-center">
                        <p className="text-sm text-destructive mb-2">Failed to load executions</p>
                        <p className="text-xs text-muted-foreground mb-4">{error.message}</p>
                        <Button variant="outline" size="sm" onClick={handleRefresh}>
                          Try Again
                        </Button>
                      </div>
                    )
                  : rootExecutions.length === 0
                    ? (
                        <EmptyState />
                      )
                    : (
                        // Render root executions with lazy loading
                        rootExecutions.map(renderRootExecution)
                      )}
          </div>
        </ScrollArea>

        {/* Details Panel */}
        {selectedExecution && (
          <>
            <Separator />
            <div className="h-1/3 min-h-[200px] max-h-[400px]">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <ExecutionDetails
                    execution={{
                      id: selectedExecution.id,
                      parentId: selectedExecution.parentExecutionId,
                      level: selectedExecution.executionDepth,
                      execution: selectedExecution,
                    }}
                    onClose={() => {
                      selectExecution(null)
                      setExecutionIdAndReset(null)
                    }}
                  />
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
