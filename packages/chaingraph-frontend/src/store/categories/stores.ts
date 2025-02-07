import type { FetchCategoriesError } from '@/store/categories/types.ts'
import type { CategorizedNodes, CategoryMetadata } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '@badaitech/chaingraph-nodes/categories/constants'
import { combine, createStore } from 'effector'
import { fetchCategorizedNodesFx } from './effects'
import {
  resetCategories,
  setCategorizedNodes,
  setCategoryMetadata,
  setError,
  setLoading,
} from './events'

// Main data stores
export const $categorizedNodes = createStore<CategorizedNodes[]>([])
  .on(setCategorizedNodes, (_, nodes) => nodes)
  .on(fetchCategorizedNodesFx.doneData, (_, nodes) => nodes)
  .reset(resetCategories)

export const $categoryMetadata = createStore<Map<string, CategoryMetadata>>(new Map())
  .on(setCategoryMetadata, (_, metadata) => metadata)
  .on(fetchCategorizedNodesFx.doneData, (_, nodes) => {
    const map = new Map<string, CategoryMetadata>()
    nodes.forEach((category) => {
      map.set(category.category, category.metadata)
    })
    return map
  })
  .reset(resetCategories)

// Loading states
export const $isLoading = createStore(false)
  .on(setLoading, (_, isLoading) => isLoading)
  .on(fetchCategorizedNodesFx.pending, (_, isPending) => isPending)

// Error state
export const $error = createStore<FetchCategoriesError | null>(null)
  .on(setError, (_, error) => error)
  .on(fetchCategorizedNodesFx.failData, (_, error) => ({
    message: error.message,
    timestamp: new Date(),
  }))
  .reset(fetchCategorizedNodesFx.done)

// Computed stores
export const $categoriesState = combine({
  categories: $categorizedNodes,
  metadata: $categoryMetadata,
  isLoading: $isLoading,
  error: $error,
})

// Helper computed store for getting category metadata
export const $getCategoryMetadata = $categoryMetadata.map(
  metadata => (categoryId: string) =>
    metadata.get(categoryId) ?? metadata.get(NODE_CATEGORIES.OTHER)!,
)

export const $categoryMetadataGetter = combine(
  $categoryMetadata,
  metadata => (categoryId: string) =>
    metadata.get(categoryId) ?? metadata.get(NODE_CATEGORIES.OTHER)!,
)
