/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { sample } from 'effector'
import { addEdgeFx, removeEdgeFx } from './effects'
import { requestAddEdge, requestRemoveEdge } from './events'

// Initialize edge operations
sample({
  clock: requestAddEdge,
  target: addEdgeFx,
})

sample({
  clock: requestRemoveEdge,
  target: removeEdgeFx,
})

// Handle successful edge additions
sample({
  clock: addEdgeFx.doneData,
  target: [], // Add any additional targets for successful edge creation
})

// Handle successful edge removals
sample({
  clock: removeEdgeFx.doneData,
  target: [], // Add any additional targets for successful edge removal
})
