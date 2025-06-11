/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionTreeError, ExecutionTreeFilters, ExecutionTreeItem } from './types'
import { combine, sample } from 'effector'
import { globalReset } from '../common'
import { executionDomain } from '../domains'
import { ExecutionStatus } from '../execution/types'
import { $activeFlowId } from '../flow/stores'
import { $trpcClient } from '../trpc/store'

// EVENTS
export const setExecutionTreeFilters = executionDomain.createEvent<Partial<ExecutionTreeFilters>>()
export const resetExecutionTreeFilters = executionDomain.createEvent()
export const setSelectedExecutionId = executionDomain.createEvent<string | null>()
export const setExecutionTreeError = executionDomain.createEvent<ExecutionTreeError | null>()
export const refreshExecutionTree = executionDomain.createEvent()

// STORES
const defaultFilters: ExecutionTreeFilters = {
  flowId: undefined,
  status: 'all',
  searchQuery: '',
  limit: 100,
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

// EFFECTS
export const fetchExecutionTreeFx = executionDomain.createEffect(
  async (filters: ExecutionTreeFilters) => {
    const client = $trpcClient.getState()
    const activeFlowId = $activeFlowId.getState()

    if (!client) {
      throw new Error('TRPC client is not initialized')
    }

    // Map frontend status to backend format
    const mapStatusToBackend = (status: ExecutionStatus | 'all'): string | undefined => {
      if (status === 'all')
        return undefined

      const statusMap: Record<ExecutionStatus, string | undefined> = {
        [ExecutionStatus.IDLE]: 'created', // Map IDLE to CREATED
        [ExecutionStatus.CREATING]: 'created', // Map CREATING to CREATED
        [ExecutionStatus.CREATED]: 'created',
        [ExecutionStatus.RUNNING]: 'running',
        [ExecutionStatus.PAUSED]: 'paused',
        [ExecutionStatus.STOPPED]: 'stopped',
        [ExecutionStatus.COMPLETED]: 'completed',
        [ExecutionStatus.ERROR]: 'failed',
      }

      return statusMap[status as ExecutionStatus] || undefined
    }

    // If no flowId is available, return empty array instead of querying
    const flowId = filters.flowId || activeFlowId
    if (!flowId) {
      return []
    }

    const data = await client.execution.getExecutionTree.query({
      flowId,
      status: mapStatusToBackend(filters.status) as any,
      limit: filters.limit,
    })

    // Transform dates to proper Date objects
    return data.map(exec => ({
      ...exec,
      createdAt: new Date(exec.createdAt),
      startedAt: exec.startedAt ? new Date(exec.startedAt) : undefined,
      completedAt: exec.completedAt ? new Date(exec.completedAt) : undefined,
    }))
  },
)

export const fetchExecutionDetailsFx = executionDomain.createEffect(
  async (executionId: string) => {
    const client = $trpcClient.getState()
    if (!client) {
      throw new Error('TRPC client is not initialized')
    }

    const data = await client.execution.getExecutionDetails.query({
      executionId,
    })

    // Transform dates to proper Date objects
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
    }
  },
)

// Store for execution tree data
export const $executionTree = executionDomain
  .createStore<ExecutionTreeItem[]>([])
  .on(fetchExecutionTreeFx.doneData, (_, data) => data)
  .reset(globalReset)

// Store for selected execution details
export const $selectedExecutionDetails = executionDomain
  .createStore<ExecutionTreeItem | null>(null)
  .on(fetchExecutionDetailsFx.doneData, (_, data) => data)
  .on(setSelectedExecutionId, (state, id) => {
    if (!id)
      return null
    return state
  })
  .reset(globalReset)

// Loading states
export const $isExecutionTreeLoading = fetchExecutionTreeFx.pending
export const $isExecutionDetailsLoading = fetchExecutionDetailsFx.pending

// Error handling
$executionTreeError
  .on(fetchExecutionTreeFx.failData, (_, error) => ({
    message: error.message,
    code: 'FETCH_TREE_ERROR',
  }))
  .on(fetchExecutionDetailsFx.failData, (_, error) => ({
    message: error.message,
    code: 'FETCH_DETAILS_ERROR',
  }))
  .reset(fetchExecutionTreeFx)
  .reset(fetchExecutionDetailsFx)

// Filtered and searched execution tree
export const $filteredExecutionTree = combine(
  $executionTree,
  $executionTreeFilters,
  (executions, filters) => {
    let filtered = executions

    // Apply client-side search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(exec =>
        exec.id.toLowerCase().includes(query)
        || exec.flowName.toLowerCase().includes(query)
        || exec.flowId.toLowerCase().includes(query)
        || (exec.triggeredByEvent?.eventName.toLowerCase().includes(query))
        || (exec.error?.message.toLowerCase().includes(query)),
      )
    }

    return filtered
  },
)

// Sample events to trigger effects
sample({
  clock: setExecutionTreeFilters,
  source: $executionTreeFilters,
  target: fetchExecutionTreeFx,
})

sample({
  clock: refreshExecutionTree,
  source: $executionTreeFilters,
  target: fetchExecutionTreeFx,
})

sample({
  clock: $selectedExecutionId,
  filter: id => id !== null,
  fn: id => id as string,
  target: fetchExecutionDetailsFx,
})

// Initial load - trigger on first subscription
export const initExecutionTree = executionDomain.createEvent()

sample({
  clock: initExecutionTree,
  source: $executionTreeFilters,
  target: fetchExecutionTreeFx,
})

// Auto-refresh when active flow changes - disabled for now
// sample({
//   clock: $activeFlowId,
//   source: $executionTreeFilters,
//   target: fetchExecutionTreeFx,
// })
