/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategorizedNodes, CategoryMetadata, NodeMetadataWithPorts } from '@badaitech/chaingraph-types'

export interface CategoryState {
  categories: CategorizedNodes[]
  metadata: Map<string, CategoryMetadata>
}

export interface FetchCategoriesError {
  message: string
  code?: string
  timestamp: Date
}

/**
 * Configuration for filtering which nodes and categories are visible.
 * Used by library consumers to customize the node palette.
 *
 * Filtering is applied in order:
 * 1. Category whitelist (if provided)
 * 2. Category blacklist
 * 3. Node type whitelist (if provided)
 * 4. Node type blacklist
 */
export interface NodeVisibilityFilter {
  /**
   * Whitelist: only show these categories.
   * If empty or undefined, all categories are shown (before blacklist is applied).
   */
  allowedCategories?: string[]

  /**
   * Blacklist: hide these categories.
   * Applied after whitelist.
   */
  hiddenCategories?: string[]

  /**
   * Whitelist: only show these node types.
   * If empty or undefined, all nodes are shown (before blacklist is applied).
   */
  allowedNodeTypes?: string[]

  /**
   * Blacklist: hide these node types.
   * Applied after whitelist.
   */
  hiddenNodeTypes?: string[]
}

/**
 * Configuration for ordering categories and nodes.
 * Used by library consumers to customize the display order.
 *
 * If not specified, default ordering is used:
 * - Categories: sorted by metadata.order
 * - Nodes: original order from backend
 */
export interface NodeOrderConfig {
  /**
   * Priority values for categories. Higher value = appears first.
   * Categories not listed use their default metadata.order.
   * @example { 'ai': 100, 'flow': 50 }
   */
  categoryPriorities?: Record<string, number>

  /**
   * Priority values for node types. Higher value = appears first within category.
   * Nodes not listed maintain their original order.
   * @example { 'llm-call': 100, 'branch': 50 }
   */
  nodePriorities?: Record<string, number>

  /**
   * Custom sort function for categories. Overrides categoryPriorities if provided.
   * Return negative if a should come before b, positive if after, 0 if equal.
   */
  categorySortFn?: (a: CategorizedNodes, b: CategorizedNodes) => number

  /**
   * Custom sort function for nodes within categories. Overrides nodePriorities if provided.
   * Return negative if a should come before b, positive if after, 0 if equal.
   */
  nodeSortFn?: (a: NodeMetadataWithPorts, b: NodeMetadataWithPorts) => number
}

/**
 * Dynamic boosts for intelligent/context-aware reordering.
 * These are temporary adjustments that can be cleared.
 */
export interface DynamicBoosts {
  /**
   * Temporary priority boosts for categories.
   */
  categories: Record<string, number>

  /**
   * Temporary priority boosts for node types.
   */
  nodes: Record<string, number>
}
