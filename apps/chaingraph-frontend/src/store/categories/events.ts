/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategorizedNodes, CategoryMetadata } from '@badaitech/chaingraph-types'
import type { FetchCategoriesError } from './types'
import { createEvent } from 'effector'

// Data events
export const setCategorizedNodes = createEvent<CategorizedNodes[]>()
export const setCategoryMetadata = createEvent<Map<string, CategoryMetadata>>()

// Loading state events
export const setLoading = createEvent<boolean>()
export const setError = createEvent<FetchCategoriesError | null>()

// Reset events
export const resetCategories = createEvent()
