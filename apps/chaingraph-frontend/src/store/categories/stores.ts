/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategorizedNodes, CategoryMetadata } from '@badaitech/chaingraph-types'
import type { FetchCategoriesError, NodeVisibilityFilter } from './types'
import { NODE_CATEGORIES } from '@badaitech/chaingraph-nodes'
import { combine } from 'effector'
import { globalReset } from '../common'
import { categoriesDomain } from '../domains'
import { $trpcClient } from '../trpc/store'

// EVENTS
export const resetCategories = categoriesDomain.createEvent()

// Node visibility filter events
export const setNodeVisibilityFilter = categoriesDomain.createEvent<NodeVisibilityFilter>()
export const updateNodeVisibilityFilter = categoriesDomain.createEvent<Partial<NodeVisibilityFilter>>()
export const resetNodeVisibilityFilter = categoriesDomain.createEvent()

// EFFECTS
export const fetchCategorizedNodesFx = categoriesDomain.createEffect(() => {
  const client = $trpcClient.getState()
  if (!client) {
    throw new Error('TRPC client is not initialized')
  }
  return client.nodeRegistry.getCategorizedNodes.query()
})

// STORES
const $categorizedNodes = categoriesDomain.createStore<CategorizedNodes[]>([])
  .on(fetchCategorizedNodesFx.doneData, (_, nodes) => nodes)
  .reset(resetCategories)
  .reset(globalReset)

export const $categoryMetadata = categoriesDomain.createStore<Map<string, CategoryMetadata>>(new Map())
  .on(fetchCategorizedNodesFx.doneData, (_, nodes) => {
    const map = new Map<string, CategoryMetadata>()
    nodes.forEach((category) => {
      map.set(category.category, category.metadata)
    })
    return map
  })
  .reset(resetCategories)
  .reset(globalReset)

const $isLoading = fetchCategorizedNodesFx.pending

const $error = categoriesDomain.createStore<FetchCategoriesError | null>(null)
  .on(fetchCategorizedNodesFx.failData, (_, error) => ({
    message: error.message,
    timestamp: new Date(),
  }))
  .reset(fetchCategorizedNodesFx.doneData)
  .reset(globalReset)

// Node visibility filter store
export const $nodeVisibilityFilter = categoriesDomain.createStore<NodeVisibilityFilter>({})
  .on(setNodeVisibilityFilter, (_, filter) => filter)
  .on(updateNodeVisibilityFilter, (state, partial) => ({ ...state, ...partial }))
  .reset(resetNodeVisibilityFilter)
  .reset(globalReset)

/**
 * Applies node visibility filter to categorized nodes.
 * Filtering order:
 * 1. Category whitelist (if provided)
 * 2. Category blacklist
 * 3. Node type whitelist (if provided)
 * 4. Node type blacklist
 * 5. Remove empty categories
 */
function applyNodeVisibilityFilter(
  categories: CategorizedNodes[],
  filter: NodeVisibilityFilter,
): CategorizedNodes[] {
  let result = categories

  // Apply category whitelist
  if (filter.allowedCategories && filter.allowedCategories.length > 0) {
    result = result.filter(c => filter.allowedCategories!.includes(c.category))
  }

  // Apply category blacklist
  if (filter.hiddenCategories && filter.hiddenCategories.length > 0) {
    result = result.filter(c => !filter.hiddenCategories!.includes(c.category))
  }

  // Apply node filtering if any node filters are specified
  if (
    (filter.allowedNodeTypes && filter.allowedNodeTypes.length > 0)
    || (filter.hiddenNodeTypes && filter.hiddenNodeTypes.length > 0)
  ) {
    result = result.map(category => ({
      ...category,
      nodes: category.nodes.filter((node) => {
        // Whitelist check
        if (filter.allowedNodeTypes && filter.allowedNodeTypes.length > 0) {
          if (!filter.allowedNodeTypes.includes(node.type)) {
            return false
          }
        }
        // Blacklist check
        if (filter.hiddenNodeTypes && filter.hiddenNodeTypes.length > 0) {
          if (filter.hiddenNodeTypes.includes(node.type)) {
            return false
          }
        }
        return true
      }),
    })).filter(category => category.nodes.length > 0) // Remove empty categories
  }

  return result
}

// Derived filtered store
const $filteredCategorizedNodes = combine(
  $categorizedNodes,
  $nodeVisibilityFilter,
  applyNodeVisibilityFilter,
)

// Computed stores
export const $categoriesState = combine({
  categories: $filteredCategorizedNodes,
  metadata: $categoryMetadata,
  isLoading: $isLoading,
  error: $error,
})

export const $categoryMetadataGetter = combine(
  $categoryMetadata,
  metadata => (categoryId: string) =>
    metadata.get(categoryId) ?? metadata.get(NODE_CATEGORIES.OTHER)!,
)

// Public API functions for library consumers

/**
 * Configure which nodes and categories are visible.
 * Replaces any existing filter configuration.
 *
 * @example
 * // Show only AI and flow-control categories
 * configureNodeVisibility({
 *   allowedCategories: ['ai', 'flow-control']
 * })
 *
 * @example
 * // Hide specific node types
 * configureNodeVisibility({
 *   hiddenNodeTypes: ['deprecated-node', 'internal-node']
 * })
 *
 * @example
 * // Combine whitelist and blacklist
 * configureNodeVisibility({
 *   allowedCategories: ['ai'],
 *   hiddenNodeTypes: ['openai-legacy']
 * })
 */
export function configureNodeVisibility(filter: NodeVisibilityFilter): void {
  setNodeVisibilityFilter(filter)
}

/**
 * Update the node visibility filter by merging with existing configuration.
 *
 * @example
 * updateNodeVisibility({ hiddenNodeTypes: ['another-node'] })
 */
export function updateNodeVisibility(partial: Partial<NodeVisibilityFilter>): void {
  updateNodeVisibilityFilter(partial)
}

/**
 * Reset node visibility filter to show all nodes and categories.
 */
export function resetNodeVisibility(): void {
  resetNodeVisibilityFilter()
}
