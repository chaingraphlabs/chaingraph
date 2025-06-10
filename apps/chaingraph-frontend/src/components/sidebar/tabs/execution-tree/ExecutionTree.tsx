/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionStatus } from '@/store/execution'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { setExecutionIdAndReset } from '@/store/execution'
import { useExecutionTree, useSelectedExecution } from '@/store/execution-tree/hooks/useExecutionTree'
import { $activeFlowId } from '@/store/flow/stores'
import { useUnit } from 'effector-react'
import { useMemo, useState } from 'react'
import { EmptyState } from './components/EmptyState'
import { ExecutionDetails } from './components/ExecutionDetails'
import { ExecutionNode } from './components/ExecutionNode'
import { TreeControls } from './components/TreeControls'
import { buildExecutionTree } from './utils/tree-builder'

export function ExecutionTree() {
  // Use Effector store for execution data
  const { executions, isLoading, error, filters, refetch, updateFilters } = useExecutionTree()
  const { selectedExecution, selectExecution } = useSelectedExecution()
  
  // Get active flow ID to check if a flow is selected
  const activeFlowId = useUnit($activeFlowId)

  // UI State
  const [expandedAll, setExpandedAll] = useState(false)

  // Build tree structure
  const executionTree = useMemo(() => {
    // Map executions to the expected interface and build tree
    const mappedExecutions = executions.map(exec => ({
      ...exec,
      status: exec.status.toUpperCase() as ExecutionStatus, // Convert backend status to frontend enum
    }))
    return buildExecutionTree(mappedExecutions as any)
  }, [executions])

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
    setExpandedAll(!expandedAll)
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
              : isLoading
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
                  : executionTree.length === 0
                    ? (
                        <EmptyState />
                      )
                    : (
                        executionTree.map(node => (
                          <ExecutionNode
                            key={node.id}
                            node={node}
                            depth={0}
                            onSelect={(node) => {
                              selectExecution(node.id)
                              setExecutionIdAndReset(node.id)
                            }}
                            selectedId={selectedExecution?.id}
                            expandedAll={expandedAll}
                          />
                        ))
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
                    execution={selectedExecution as any}
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
