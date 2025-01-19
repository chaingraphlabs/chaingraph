import type { CategorizedNodes } from '@chaingraph/nodes'
import type { CategoryMetadata } from '@chaingraph/types'

export interface CategoryState {
  categories: CategorizedNodes[]
  metadata: Map<string, CategoryMetadata>
}

export interface FetchCategoriesError {
  message: string
  code?: string
  timestamp: Date
}
