/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EdgeData, EdgeError } from './types'
import {
  addEdgeFx,
  clearActiveFlow,
  removeEdge,
  removeEdgeFx,
  resetEdges,
  setEdge,
  setEdges,
  setEdgesError,
  setEdgesLoading,
} from '@/store'
import { combine, createStore } from 'effector'

// Main edges store
export const $edges = createStore<EdgeData[]>([])
  .on(setEdges, (source, edges) => [
    ...source,
    ...edges,
  ])
  .on(setEdge, (edges, edge) => [
    ...edges,
    { ...edge },
  ])
  .on(removeEdge, (edges, event) => edges.filter(
    edge => edge.edgeId !== event.edgeId,
  ))
  .reset(resetEdges)
  .reset(clearActiveFlow)

// Loading state
export const $isEdgesLoading = createStore(false)
  .on(setEdgesLoading, (_, isLoading) => isLoading)
  .on(addEdgeFx.pending, (_, isPending) => isPending)
  .on(removeEdgeFx.pending, (_, isPending) => isPending)

// Error state
export const $edgesError = createStore<EdgeError | null>(null)
  .on(setEdgesError, (_, error) => error)
  .on(addEdgeFx.failData, (_, error) => ({
    message: error.message,
    timestamp: new Date(),
  }))
  .on(removeEdgeFx.failData, (_, error) => ({
    message: error.message,
    timestamp: new Date(),
  }))
  .reset([addEdgeFx.done, removeEdgeFx.done])

// Combined store for edge state
export const $edgesState = combine({
  edges: $edges,
  isLoading: $isEdgesLoading,
  error: $edgesError,
})
