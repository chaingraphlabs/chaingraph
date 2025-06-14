/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionTreeFilters } from '../types'
import { useUnit } from 'effector-react'
import { useEffect, useRef } from 'react'
import {
  $executionTreeError,
  $executionTreeFilters,
  $filteredExecutionTree,
  $isExecutionDetailsLoading,
  $isExecutionTreeLoading,
  $selectedExecutionDetails,
  $selectedExecutionId,
  initExecutionTree,
  refreshExecutionTree,
  setExecutionTreeFilters,
  setSelectedExecutionId,
} from '../stores'

export function useExecutionTree() {
  const executions = useUnit($filteredExecutionTree)
  const isLoading = useUnit($isExecutionTreeLoading)
  const error = useUnit($executionTreeError)
  const filters = useUnit($executionTreeFilters)

  // Auto-refresh interval
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Initial load
    initExecutionTree()

    // Auto-refresh disabled for now - only manual refresh via button
    // intervalRef.current = setInterval(() => {
    //   refreshExecutionTree()
    // }, 5000)

    // return () => {
    //   if (intervalRef.current) {
    //     clearInterval(intervalRef.current)
    //   }
    // }
  }, [])

  const refetch = () => {
    refreshExecutionTree()
  }

  const updateFilters = (newFilters: Partial<ExecutionTreeFilters>) => {
    setExecutionTreeFilters(newFilters)
  }

  return {
    executions,
    isLoading,
    error,
    filters,
    refetch,
    updateFilters,
  }
}

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
