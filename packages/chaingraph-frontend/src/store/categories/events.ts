import type { FetchCategoriesError } from '@/store/categories/types.ts'
import type { CategorizedNodes } from '@chaingraph/nodes'
import type { CategoryMetadata } from '@chaingraph/types'
import { createEvent } from 'effector'

// Data events
export const setCategorizedNodes = createEvent<CategorizedNodes[]>()
export const setCategoryMetadata = createEvent<Map<string, CategoryMetadata>>()

// Loading state events
export const setLoading = createEvent<boolean>()
export const setError = createEvent<FetchCategoriesError | null>()

// Reset events
export const resetCategories = createEvent()
