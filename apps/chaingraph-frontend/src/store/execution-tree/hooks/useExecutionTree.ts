/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionTreeFilters } from '../types'
import { useUnit } from 'effector-react'
import { useEffect } from 'react'
import { $activeFlowId } from '@/store/flow/stores'
import {
  $executionTreeError,
  $executionTreeFilters,
  $expandedTrees,
  $filteredRootExecutions,
  $isExecutionDetailsLoading,
  $loadingTrees,
  $rootExecutions,
  $selectedExecutionDetails,
  $selectedExecutionId,
  collapseExecution,
  expandExecution,
  fetchRootExecutionsFx,
  initExecutionTree,
  refreshExecutionTree,
  setExecutionTreeFilters,
  setSelectedExecutionId,
} from '../stores'

/**
 * Hook for managing the execution tree with lazy loading
 */
export function useExecutionTree() {
  const rootExecutions = useUnit($filteredRootExecutions)
  const expandedTrees = useUnit($expandedTrees)
  const loadingTrees = useUnit($loadingTrees)
  const isLoadingRoots = useUnit(fetchRootExecutionsFx.pending)
  const error = useUnit($executionTreeError)
  const filters = useUnit($executionTreeFilters)
  const activeFlowId = useUnit($activeFlowId)

  useEffect(() => {
    // Initial load when component mounts
    if (activeFlowId) {
      initExecutionTree()
    }
  }, [activeFlowId])

  const handleExpand = (executionId: string) => {
    expandExecution(executionId)
  }

  const handleCollapse = (executionId: string) => {
    collapseExecution(executionId)
  }

  const isTreeLoading = (executionId: string): boolean => {
    return loadingTrees.has(executionId)
  }

  const getExecutionTree = (executionId: string) => {
    return expandedTrees.get(executionId) || []
  }

  const isExpanded = (executionId: string): boolean => {
    return expandedTrees.has(executionId)
  }

  const refetch = () => {
    refreshExecutionTree()
  }

  const updateFilters = (newFilters: Partial<ExecutionTreeFilters>) => {
    setExecutionTreeFilters(newFilters)
  }

  return {
    // Data
    rootExecutions,
    expandedTrees,

    // Loading states
    isLoadingRoots,
    isTreeLoading,

    // Error state
    error,

    // Filters
    filters,
    updateFilters,

    // Actions
    handleExpand,
    handleCollapse,
    getExecutionTree,
    isExpanded,
    refetch,
  }
}

/**
 * Hook for managing selected execution details
 */
export function useSelectedExecution() {
  const selectedExecutionId = useUnit($selectedExecutionId)
  const selectedExecution = useUnit($selectedExecutionDetails)
  const isLoading = useUnit($isExecutionDetailsLoading)

  const selectExecution = (executionId: string | null) => {
    setSelectedExecutionId(executionId)
  }

  return {
    selectedExecutionId,
    selectedExecution,
    isLoading,
    selectExecution,
  }
}

/**
 * Hook for getting all execution tree data (for compatibility)
 * This combines root executions with their expanded trees
 */
export function useExecutionTreeData() {
  const rootExecutions = useUnit($rootExecutions)
  const expandedTrees = useUnit($expandedTrees)
  const loadingTrees = useUnit($loadingTrees)

  // Build a combined tree structure for components that need it
  const buildFullTree = () => {
    return rootExecutions.map(rootExec => ({
      root: rootExec,
      isExpanded: expandedTrees.has(rootExec.execution.id),
      isLoading: loadingTrees.has(rootExec.execution.id),
      children: expandedTrees.get(rootExec.execution.id) || [],
    }))
  }

  return {
    fullTree: buildFullTree(),
    rootExecutions,
    expandedTrees,
  }
}
