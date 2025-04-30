/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategorizedNodes, CategoryMetadata } from '@badaitech/chaingraph-types'
import type { FetchCategoriesError } from './types'
import { NODE_CATEGORIES } from '@badaitech/chaingraph-nodes'
import { combine } from 'effector'
import { categoriesDomain } from '../domains'
import { $trpcClient } from '../trpc/store'

// EVENTS
export const resetCategories = categoriesDomain.createEvent()

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

export const $categoryMetadata = categoriesDomain.createStore<Map<string, CategoryMetadata>>(new Map())
  .on(fetchCategorizedNodesFx.doneData, (_, nodes) => {
    const map = new Map<string, CategoryMetadata>()
    nodes.forEach((category) => {
      map.set(category.category, category.metadata)
    })
    return map
  })
  .reset(resetCategories)

const $isLoading = fetchCategorizedNodesFx.pending

const $error = categoriesDomain.createStore<FetchCategoriesError | null>(null)
  .on(fetchCategorizedNodesFx.failData, (_, error) => ({
    message: error.message,
    timestamp: new Date(),
  }))
  .reset(fetchCategorizedNodesFx.doneData)

// Computed stores
export const $categoriesState = combine({
  categories: $categorizedNodes,
  metadata: $categoryMetadata,
  isLoading: $isLoading,
  error: $error,
})

export const $categoryMetadataGetter = combine(
  $categoryMetadata,
  metadata => (categoryId: string) =>
    metadata.get(categoryId) ?? metadata.get(NODE_CATEGORIES.OTHER)!,
)
