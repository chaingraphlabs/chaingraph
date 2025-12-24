/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { edgesDomain } from '@/store/domains'
import { globalReset } from '../common'

// Events
export const selectEdge = edgesDomain.createEvent<string | null>()
export const deselectEdge = edgesDomain.createEvent()

// Store
export const $selectedEdgeId = edgesDomain.createStore<string | null>(null)
  .on(selectEdge, (_, edgeId) => edgeId)
  .on(deselectEdge, () => null)
  .reset(globalReset)

// Derived store
export const $hasEdgeSelected = $selectedEdgeId.map(id => id !== null)
