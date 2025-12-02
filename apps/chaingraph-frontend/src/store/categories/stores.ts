/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategorizedNodes, CategoryMetadata } from '@badaitech/chaingraph-types'
import type { DynamicBoosts, FetchCategoriesError, NodeOrderConfig, NodeVisibilityFilter } from './types'
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

// Node ordering events
export const setNodeOrderConfig = categoriesDomain.createEvent<NodeOrderConfig>()
export const updateNodeOrderConfig = categoriesDomain.createEvent<Partial<NodeOrderConfig>>()
export const resetNodeOrderConfig = categoriesDomain.createEvent()

// Dynamic boost events
export const setDynamicBoosts = categoriesDomain.createEvent<DynamicBoosts>()
export const boostCategoriesEvent = categoriesDomain.createEvent<{ categoryIds: string[], priority: number }>()
export const boostNodesEvent = categoriesDomain.createEvent<{ nodeTypes: string[], priority: number }>()
export const clearDynamicBoosts = categoriesDomain.createEvent()
export const clearCategoryBoosts = categoriesDomain.createEvent()
export const clearNodeBoosts = categoriesDomain.createEvent()

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

// Node ordering config store
export const $nodeOrderConfig = categoriesDomain.createStore<NodeOrderConfig>({})
  .on(setNodeOrderConfig, (_, config) => config)
  .on(updateNodeOrderConfig, (state, partial) => ({ ...state, ...partial }))
  .reset(resetNodeOrderConfig)
  .reset(globalReset)

// Dynamic boosts store
const defaultDynamicBoosts: DynamicBoosts = { categories: {}, nodes: {} }
export const $dynamicBoosts = categoriesDomain.createStore<DynamicBoosts>(defaultDynamicBoosts)
  .on(setDynamicBoosts, (_, boosts) => boosts)
  .on(boostCategoriesEvent, (state, { categoryIds, priority }) => ({
    ...state,
    categories: {
      ...state.categories,
      ...Object.fromEntries(categoryIds.map(id => [id, priority])),
    },
  }))
  .on(boostNodesEvent, (state, { nodeTypes, priority }) => ({
    ...state,
    nodes: {
      ...state.nodes,
      ...Object.fromEntries(nodeTypes.map(type => [type, priority])),
    },
  }))
  .on(clearCategoryBoosts, state => ({ ...state, categories: {} }))
  .on(clearNodeBoosts, state => ({ ...state, nodes: {} }))
  .reset(clearDynamicBoosts)
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

/**
 * Applies ordering to categorized nodes.
 * If no ordering config is provided, uses default behavior:
 * - Categories: sorted by metadata.order
 * - Nodes: original order from backend
 *
 * Effective order = baseOrder - staticPriority - dynamicBoost
 * (lower effective order = appears first)
 */
function applyNodeOrdering(
  categories: CategorizedNodes[],
  orderConfig: NodeOrderConfig,
  dynamicBoosts: DynamicBoosts,
): CategorizedNodes[] {
  const hasOrderConfig = orderConfig.categoryPriorities
    || orderConfig.nodePriorities
    || orderConfig.categorySortFn
    || orderConfig.nodeSortFn
  const hasDynamicBoosts = Object.keys(dynamicBoosts.categories).length > 0
    || Object.keys(dynamicBoosts.nodes).length > 0

  // If no ordering specified, return with default category order (by metadata.order)
  if (!hasOrderConfig && !hasDynamicBoosts) {
    return [...categories].sort((a, b) => a.metadata.order - b.metadata.order)
  }

  // Sort categories
  let sortedCategories: CategorizedNodes[]

  if (orderConfig.categorySortFn) {
    // Use custom sort function
    sortedCategories = [...categories].sort(orderConfig.categorySortFn)
  } else {
    // Use priority-based sorting
    sortedCategories = [...categories].sort((a, b) => {
      const aPriority = (orderConfig.categoryPriorities?.[a.category] ?? 0)
        + (dynamicBoosts.categories[a.category] ?? 0)
      const bPriority = (orderConfig.categoryPriorities?.[b.category] ?? 0)
        + (dynamicBoosts.categories[b.category] ?? 0)

      // Higher priority = appears first (so we subtract priority from order)
      const aEffectiveOrder = a.metadata.order - aPriority
      const bEffectiveOrder = b.metadata.order - bPriority

      return aEffectiveOrder - bEffectiveOrder
    })
  }

  // Sort nodes within categories if needed
  const hasNodeOrdering = orderConfig.nodeSortFn
    || orderConfig.nodePriorities
    || Object.keys(dynamicBoosts.nodes).length > 0

  if (!hasNodeOrdering) {
    return sortedCategories
  }

  return sortedCategories.map((category) => {
    if (orderConfig.nodeSortFn) {
      // Use custom sort function
      return {
        ...category,
        nodes: [...category.nodes].sort(orderConfig.nodeSortFn),
      }
    }

    // Use priority-based sorting for nodes
    const sortedNodes = [...category.nodes].sort((a, b) => {
      const aPriority = (orderConfig.nodePriorities?.[a.type] ?? 0)
        + (dynamicBoosts.nodes[a.type] ?? 0)
      const bPriority = (orderConfig.nodePriorities?.[b.type] ?? 0)
        + (dynamicBoosts.nodes[b.type] ?? 0)

      // If both have no priority, maintain original order
      if (aPriority === 0 && bPriority === 0) {
        return 0
      }

      // Higher priority = appears first
      return bPriority - aPriority
    })

    return { ...category, nodes: sortedNodes }
  })
}

// Derived filtered store
const $filteredCategorizedNodes = combine(
  $categorizedNodes,
  $nodeVisibilityFilter,
  applyNodeVisibilityFilter,
)

// Derived filtered and ordered store
const $filteredAndOrderedCategories = combine(
  $filteredCategorizedNodes,
  $nodeOrderConfig,
  $dynamicBoosts,
  applyNodeOrdering,
)

// Computed stores
export const $categoriesState = combine({
  categories: $filteredAndOrderedCategories,
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

// ============================================================================
// Node Ordering API
// ============================================================================

/**
 * Configure the ordering of categories and nodes.
 * Replaces any existing ordering configuration.
 * If not configured, default ordering is used (categories by metadata.order, nodes by backend order).
 *
 * @example
 * // Boost AI categories to appear first
 * configureNodeOrdering({
 *   categoryPriorities: { 'ai': 100, 'anthropic': 90 }
 * })
 *
 * @example
 * // Boost specific nodes within their categories
 * configureNodeOrdering({
 *   nodePriorities: { 'llm-call': 100, 'branch': 50 }
 * })
 *
 * @example
 * // Use custom sort function for categories
 * configureNodeOrdering({
 *   categorySortFn: (a, b) => a.metadata.label.localeCompare(b.metadata.label)
 * })
 */
export function configureNodeOrdering(config: NodeOrderConfig): void {
  setNodeOrderConfig(config)
}

/**
 * Update the node ordering configuration by merging with existing configuration.
 *
 * @example
 * updateNodeOrdering({ categoryPriorities: { 'flow': 80 } })
 */
export function updateNodeOrdering(partial: Partial<NodeOrderConfig>): void {
  updateNodeOrderConfig(partial)
}

/**
 * Reset node ordering to default behavior.
 */
export function resetNodeOrdering(): void {
  resetNodeOrderConfig()
}

/**
 * Temporarily boost categories to appear higher in the list.
 * Useful for intelligent/context-aware suggestions.
 * Use clearBoosts() to reset.
 *
 * @param categoryIds - Array of category IDs to boost
 * @param priority - Priority value (higher = appears first). Default: 1000
 *
 * @example
 * // Boost AI-related categories when user is in an AI context
 * boostCategories(['ai', 'anthropic'], 1000)
 */
export function boostCategories(categoryIds: string[], priority: number = 1000): void {
  boostCategoriesEvent({ categoryIds, priority })
}

/**
 * Temporarily boost specific node types to appear higher in their categories.
 * Useful for intelligent/context-aware suggestions.
 * Use clearBoosts() to reset.
 *
 * @param nodeTypes - Array of node type IDs to boost
 * @param priority - Priority value (higher = appears first). Default: 1000
 *
 * @example
 * // Boost commonly used nodes based on user behavior
 * boostNodes(['llm-call', 'branch', 'message'], 500)
 */
export function boostNodes(nodeTypes: string[], priority: number = 1000): void {
  boostNodesEvent({ nodeTypes, priority })
}

/**
 * Clear all dynamic boosts (both categories and nodes).
 * Does not affect static ordering configuration.
 */
export function clearBoosts(): void {
  clearDynamicBoosts()
}
