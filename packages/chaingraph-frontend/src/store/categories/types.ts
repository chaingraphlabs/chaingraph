import type { CategorizedNodes, CategoryMetadata } from '@chaingraph/types'

export interface CategoryState {
  categories: CategorizedNodes[]
  metadata: Map<string, CategoryMetadata>
}

export interface FetchCategoriesError {
  message: string
  code?: string
  timestamp: Date
}
