/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionRow } from '@badaitech/chaingraph-executor/server'
import type { RootExecution } from '@badaitech/chaingraph-executor/types'
import type { ExecutionTreeError, ExecutionTreeFilters, ExpandedTreesMap } from './types'
import { combine, sample } from 'effector'
import { globalReset } from '../common'
import { executionDomain } from '../domains'
import { $activeFlowId } from '../flow/stores'
import { $trpcClientExecutor } from '../trpc/execution-client'

// ============================================================================
// EVENTS
// ============================================================================
export const setExecutionTreeFilters = executionDomain.createEvent<Partial<ExecutionTreeFilters>>()
export const resetExecutionTreeFilters = executionDomain.createEvent()
export const setSelectedExecutionId = executionDomain.createEvent<string | null>()
export const setExecutionTreeError = executionDomain.createEvent<ExecutionTreeError | null>()
export const refreshExecutionTree = executionDomain.createEvent()

// New events for lazy loading
export const expandExecution = executionDomain.createEvent<string>()
export const collapseExecution = executionDomain.createEvent<string>()
export const setRootExecutions = executionDomain.createEvent<RootExecution[]>()

// ============================================================================
// STORES
// ============================================================================
const defaultFilters: ExecutionTreeFilters = {
  flowId: undefined,
  status: 'all',
  searchQuery: '',
  limit: 100,
  after: undefined,
}

export const $executionTreeFilters = executionDomain
  .createStore<ExecutionTreeFilters>(defaultFilters)
  .on(setExecutionTreeFilters, (state, filters) => ({ ...state, ...filters }))
  .reset(resetExecutionTreeFilters)
  .reset(globalReset)

export const $selectedExecutionId = executionDomain
  .createStore<string | null>(null)
  .on(setSelectedExecutionId, (_, id) => id)
  .reset(globalReset)

export const $executionTreeError = executionDomain
  .createStore<ExecutionTreeError | null>(null)
  .on(setExecutionTreeError, (_, error) => error)
  .reset(globalReset)

// New stores for lazy loading
export const $rootExecutions = executionDomain
  .createStore<RootExecution[]>([])
  .on(setRootExecutions, (_, executions) => executions)
  .reset(globalReset)

export const $expandedTrees = executionDomain
  .createStore<ExpandedTreesMap>(new Map())
  .on(collapseExecution, (state, executionId) => {
    const newMap = new Map(state)
    newMap.delete(executionId)
    return newMap
  })
  .reset(globalReset)

export const $loadingTrees = executionDomain
  .createStore<Set<string>>(new Set())
  .reset(globalReset)

// ============================================================================
// EFFECTS
// ============================================================================

// Fetch root executions with statistics
export const fetchRootExecutionsFx = executionDomain.createEffect(
  async (params: { flowId: string, limit?: number, after?: Date }) => {
    const client = $trpcClientExecutor.getState()

    if (!client) {
      throw new Error('TRPC client is not initialized')
    }

    const { flowId, limit = 100, after } = params

    return await client.getRootExecutions.query({
      flowId,
      limit,
      after,
    })
  },
)

// Fetch execution tree for a specific root execution
export const fetchExecutionTreeFx = executionDomain.createEffect(
  async (executionId: string) => {
    const client = $trpcClientExecutor.getState()

    if (!client) {
      throw new Error('TRPC client is not initialized')
    }

    const data = await client.getExecutionsTree.query({
      executionId,
    })

    return { executionId, tree: data }
  },
)

// Fetch details for a specific execution (for selected execution panel)
export const fetchExecutionDetailsFx = executionDomain.createEffect(
  async (executionId: string) => {
    const client = $trpcClientExecutor.getState()
    if (!client) {
      throw new Error('TRPC client is not initialized')
    }

    // For now, we'll use the tree endpoint to get details
    // In the future, we might want a separate endpoint for single execution details
    const data = await client.getExecutionDetails.query({
      executionId,
    })

    // Return the root node from the tree
    return data
  },
)

// ============================================================================
// STORE UPDATES
// ============================================================================

// Update root executions when fetched
$rootExecutions
  .on(fetchRootExecutionsFx.doneData, (_, data) => data)

// Update expanded trees when fetched
$expandedTrees
  .on(fetchExecutionTreeFx.doneData, (state, { executionId, tree }) => {
    const newMap = new Map(state)
    newMap.set(executionId, tree)
    return newMap
  })

// Track loading state for individual trees
$loadingTrees
  .on(fetchExecutionTreeFx, (state, executionId) => {
    const newSet = new Set(state)
    newSet.add(executionId)
    return newSet
  })
  .on(fetchExecutionTreeFx.finally, (state, { params: executionId }) => {
    const newSet = new Set(state)
    newSet.delete(executionId)
    return newSet
  })

// Store for selected execution details
export const $selectedExecutionDetails = executionDomain
  .createStore<ExecutionRow | null>(null)
  .on(fetchExecutionDetailsFx.doneData, (_, data) => data as ExecutionRow)
  .on(setSelectedExecutionId, (state, id) => {
    if (!id)
      return null
    return state
  })
  .reset(globalReset)

// ============================================================================
// COMPUTED STORES
// ============================================================================

// Loading states
export const $isExecutionDetailsLoading = fetchExecutionDetailsFx.pending

// Filtered root executions (client-side filtering for search)
export const $filteredRootExecutions = combine(
  $rootExecutions,
  $executionTreeFilters,
  (executions, filters) => {
    let filtered = executions

    // Apply client-side search filter if needed
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter((exec) => {
        const execution = exec.execution
        return (
          execution.id.toLowerCase().includes(query)
          || execution.flowId.toLowerCase().includes(query)
          || (execution.errorMessage?.toLowerCase().includes(query))
        )
      })
    }

    // Note: Status filtering should be done server-side in getRootExecutions
    // But we can add client-side filtering here if needed

    return filtered
  },
)

// ============================================================================
// ERROR HANDLING
// ============================================================================

$executionTreeError
  .on(fetchRootExecutionsFx.failData, (_, error) => ({
    message: error.message,
    code: 'FETCH_ROOTS_ERROR',
  }))
  .on(fetchExecutionTreeFx.failData, (_, error) => ({
    message: error.message,
    code: 'FETCH_TREE_ERROR',
  }))
  .on(fetchExecutionDetailsFx.failData, (_, error) => ({
    message: error.message,
    code: 'FETCH_DETAILS_ERROR',
  }))
  .reset(fetchRootExecutionsFx)
  .reset(fetchExecutionTreeFx)
  .reset(fetchExecutionDetailsFx)

// ============================================================================
// SAMPLES (Event connections)
// ============================================================================

// Trigger tree fetch when expanding an execution
sample({
  clock: expandExecution,
  filter: (executionId) => {
    const expanded = $expandedTrees.getState()
    const loading = $loadingTrees.getState()
    // Only fetch if not already loaded and not currently loading
    return !expanded.has(executionId) && !loading.has(executionId)
  },
  target: fetchExecutionTreeFx,
})

// Fetch root executions when filters change
sample({
  clock: setExecutionTreeFilters,
  source: combine($executionTreeFilters, $activeFlowId),
  filter: ([filters, activeFlowId]) => !!(filters.flowId || activeFlowId),
  fn: ([filters, activeFlowId]) => ({
    flowId: filters.flowId || activeFlowId!,
    limit: filters.limit,
    after: filters.after,
  }),
  target: fetchRootExecutionsFx,
})

// Refresh root executions
sample({
  clock: refreshExecutionTree,
  source: combine($executionTreeFilters, $activeFlowId),
  filter: ([filters, activeFlowId]) => !!(filters.flowId || activeFlowId),
  fn: ([filters, activeFlowId]) => ({
    flowId: filters.flowId || activeFlowId!,
    limit: filters.limit,
    after: filters.after,
  }),
  target: fetchRootExecutionsFx,
})

// Fetch details when selecting an execution
sample({
  clock: $selectedExecutionId,
  filter: id => id !== null,
  fn: id => id as string,
  target: fetchExecutionDetailsFx,
})

// Initial load when active flow changes
sample({
  clock: $activeFlowId,
  filter: flowId => flowId !== null,
  fn: flowId => ({
    flowId: flowId!,
    limit: $executionTreeFilters.getState().limit,
    after: $executionTreeFilters.getState().after,
  }),
  target: fetchRootExecutionsFx,
})

// Initial load event (for manual triggering) - moved here to avoid redeclaration
export const initExecutionTree = executionDomain.createEvent()

sample({
  clock: initExecutionTree,
  source: combine($executionTreeFilters, $activeFlowId),
  filter: ([filters, activeFlowId]) => !!(filters.flowId || activeFlowId),
  fn: ([filters, activeFlowId]) => ({
    flowId: filters.flowId || activeFlowId!,
    limit: filters.limit,
    after: filters.after,
  }),
  target: fetchRootExecutionsFx,
})
