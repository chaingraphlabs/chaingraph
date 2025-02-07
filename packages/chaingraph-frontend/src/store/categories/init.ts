/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { createEffect, sample } from 'effector'
import { fetchCategorizedNodesFx } from './effects'
import { setCategorizedNodes } from './events'

// Handle fetch results
sample({
  clock: fetchCategorizedNodesFx.doneData,
  target: [
    setCategorizedNodes,
    // Metadata will be updated automatically through store handlers
  ],
})

export const initializeCategoriesFx = createEffect(async () => {
  return await fetchCategorizedNodesFx()
})

sample({
  clock: initializeCategoriesFx,
  target: fetchCategorizedNodesFx,
})
