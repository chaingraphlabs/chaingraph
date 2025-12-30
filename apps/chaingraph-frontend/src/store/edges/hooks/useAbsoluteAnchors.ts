/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EdgeAnchor } from '@badaitech/chaingraph-types'
import { useStoreMap } from 'effector-react'
import isDeepEqual from 'fast-deep-equal'
import { $absoluteAnchors } from '../anchors'

/**
 * Subscribe to absolute anchors for a specific edge
 *
 * CRITICAL PERFORMANCE:
 * - Uses useStoreMap with selective subscription (not useUnit!)
 * - Only re-renders when THIS edge's anchors change
 * - updateFilter prevents re-renders on reference changes without value changes
 *
 * Performance comparison:
 * - 100 edges on canvas, 1 node moves → only 2-3 edges re-render (those with parented anchors)
 * - NOT all 100 edges!
 *
 * This hook eliminates the antipattern of:
 * ```typescript
 * const nodes = useUnit($nodes)  // ❌ All edges re-render on any node change
 * const absoluteAnchors = useMemo(() => transform(anchors, nodes), [anchors, nodes])
 * ```
 *
 * And replaces it with store-level precomputation:
 * ```typescript
 * const absoluteAnchors = useAbsoluteAnchors(edgeId)  // ✅ Only this edge re-renders
 * ```
 *
 * @param edgeId - Edge ID to subscribe to
 * @returns Anchors with absolute coordinates (ready for rendering)
 */
export function useAbsoluteAnchors(edgeId: string): EdgeAnchor[] {
  return useStoreMap({
    store: $absoluteAnchors,
    keys: [edgeId],
    fn: (map, [id]) => map.get(id) ?? [],
    // Only re-render if anchor data actually changed (deep comparison)
    // This prevents re-renders when the Map is recreated but edge data is unchanged
    updateFilter: (prev, next) => !isDeepEqual(prev, next),
  })
}
