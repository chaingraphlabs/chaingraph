/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategorizedNodes, CategoryMetadata } from '@badaitech/chaingraph-types'

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
