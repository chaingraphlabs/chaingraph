/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { edgesDomain } from '@/store/domains'
import { globalReset } from '../common'
import { deselectEdge } from './selection'

// Events
export const selectAnchor = edgesDomain.createEvent<string | null>()
export const deselectAnchor = edgesDomain.createEvent()
export const startDraggingAnchor = edgesDomain.createEvent()
export const stopDraggingAnchor = edgesDomain.createEvent()

// Store - NOT synced to backend, purely UI state
export const $selectedAnchorId = edgesDomain.createStore<string | null>(null)
  .on(selectAnchor, (_, anchorId) => anchorId)
  .on(deselectAnchor, () => null)
  .reset(deselectEdge) // Deselect anchor when edge deselected
  .reset(globalReset)

// Track if anchor is being dragged - prevents edge deselection on pane click
export const $isDraggingAnchor = edgesDomain.createStore<boolean>(false)
  .on(startDraggingAnchor, () => true)
  .on(stopDraggingAnchor, () => false)
  .reset(globalReset)
