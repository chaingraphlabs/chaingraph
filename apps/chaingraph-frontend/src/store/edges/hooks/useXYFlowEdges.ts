/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EdgeRenderData } from '../types'
import { useUnit } from 'effector-react'
import { useMemo } from 'react'
import { $edgeRenderMap, $xyflowEdgesList } from '../stores'

/**
 * Hook that returns XYFlow edges with optimized re-rendering.
 *
 * Leverages the new map-based architecture:
 * 1. Uses $xyflowEdgesList (already filtered to ready edges)
 * 2. Memoizes by version sum (avoids deep comparison)
 * 3. Falls back to reference equality when versions unchanged
 */
export function useXYFlowEdges() {
  const edges = useUnit($xyflowEdgesList)
  return edges
}
