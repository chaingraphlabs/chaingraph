/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { AddEdgeEventData, EdgeData, EdgeError, RemoveEdgeEventData } from './types'
import { edgesDomain } from '../domains'

// Edge CRUD events
export const removeEdge = edgesDomain.createEvent<RemoveEdgeEventData>()
export const setEdges = edgesDomain.createEvent<EdgeData[]>()
export const setEdge = edgesDomain.createEvent<EdgeData>()

// Back-end interaction events
export const requestAddEdge = edgesDomain.createEvent<AddEdgeEventData>()
export const requestRemoveEdge = edgesDomain.createEvent<RemoveEdgeEventData>()

// Loading state events
export const setEdgesLoading = edgesDomain.createEvent<boolean>()
export const setEdgesError = edgesDomain.createEvent<EdgeError | null>()

// Reset events
export const resetEdges = edgesDomain.createEvent()
