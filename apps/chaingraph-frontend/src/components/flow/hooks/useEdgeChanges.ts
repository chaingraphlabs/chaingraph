/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EdgeChange } from '@xyflow/react'
import { requestRemoveEdge } from '@/store/edges'
import { $activeFlowMetadata } from '@/store/flow'
import { useUnit } from 'effector-react'
import { useCallback } from 'react'

/**
 * Hook for handling edge changes (removal, selection)
 */
export function useEdgeChanges() {
  const activeFlow = useUnit($activeFlowMetadata)

  // Handle edge changes (removal, selection)
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    if (!activeFlow?.id)
      return

    console.debug('[useEdgeChanges] Edge changes:', changes)

    changes.forEach((change) => {
      switch (change.type) {
        case 'remove':
          requestRemoveEdge({
            flowId: activeFlow.id!,
            edgeId: change.id,
          })
          break
        case 'select':
          // Handle edge selection if needed
          break
      }
    })
  }, [activeFlow?.id])

  return {
    onEdgesChange,
  }
}
