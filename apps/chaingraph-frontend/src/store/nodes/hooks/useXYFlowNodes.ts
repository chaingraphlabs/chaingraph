/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useStoreMap } from 'effector-react'
import { $combinedXYFlowNodesList as $xyflowNodes } from '@/store/xyflow/stores'

/**
 * Returns XYFlow nodes from the store.
 *
 * NOTE: updateFilter removed to fix race condition during 60fps resize/drag events.
 * XYFlow's internal React.memo and shouldComponentUpdate handle re-render optimization.
 */
export function useXYFlowNodes() {
  const nodes = useStoreMap({
    store: $xyflowNodes,
    keys: [],
    fn: nodes => nodes,
    // No updateFilter - let XYFlow handle optimization
  })

  return nodes
}
