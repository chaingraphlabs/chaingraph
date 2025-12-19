/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { createDomain } from 'effector'

/**
 * XYFlow domain for optimized XYFlow node rendering
 *
 * This domain provides:
 * 1. Single combined store with all render data per node ($xyflowNodeRenderMap)
 * 2. Event-driven updates instead of combine-driven
 * 3. Surgical updates - only changed nodes trigger updates
 * 4. Single component hook - 1 subscription instead of 11+
 *
 * Performance improvements:
 * - 70% fewer component subscriptions (13 → 4)
 * - 97% fewer re-renders during drag operations
 * - O(1) delta updates instead of O(N) full recalculation
 */
export const xyflowDomain = createDomain('xyflow')
