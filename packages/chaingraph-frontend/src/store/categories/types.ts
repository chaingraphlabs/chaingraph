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
