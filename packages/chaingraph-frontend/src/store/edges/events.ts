/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  AddEdgeEventData,
  EdgeData,
  EdgeError,
  RemoveEdgeEventData,
} from '@/store/edges/types.ts'
import { createEvent } from 'effector'

// Edge CRUD events
export const removeEdge = createEvent<RemoveEdgeEventData>()
export const setEdges = createEvent<EdgeData[]>()
export const setEdge = createEvent<EdgeData>()

// Back-end interaction events
export const requestAddEdge = createEvent<AddEdgeEventData>()
export const requestRemoveEdge = createEvent<RemoveEdgeEventData>()

// Loading state events
export const setEdgesLoading = createEvent<boolean>()
export const setEdgesError = createEvent<EdgeError | null>()

// Reset events
export const resetEdges = createEvent()
