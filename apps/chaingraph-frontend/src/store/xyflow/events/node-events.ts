/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { XYFlowNodesDataChangedPayload } from '../types'
import { xyflowDomain } from '../domain'

/**
 * Batch data changes event
 *
 * Medium-high frequency - called when any source store changes
 * Each change includes only the delta (changed fields)
 *
 * Performance: O(K) where K = number of changed nodes (not total nodes)
 */
export const xyflowNodesDataChanged = xyflowDomain.createEvent<XYFlowNodesDataChangedPayload>()

/**
 * Structure changes event
 *
 * Low frequency - only called when nodes are added/removed
 * Triggers full rebuild of $xyflowNodeRenderMap from all source stores
 *
 * Use debounce (50ms) to prevent multiple rebuilds during bulk operations
 */
export const xyflowStructureChanged = xyflowDomain.createEvent()

/**
 * Internal event to set the complete render map
 * Used by fork-safe sample() pattern for structure rebuilds
 */
export const setXYFlowNodeRenderMap = xyflowDomain.createEvent<Record<string, import('../types').XYFlowNodeRenderData>>()
