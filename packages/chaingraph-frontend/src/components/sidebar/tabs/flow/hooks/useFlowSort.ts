/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { FlowMetadata } from '@badaitech/chaingraph-types'
import { useMemo } from 'react'

export function useFlowSort(flows: FlowMetadata[] | undefined, selectedFlowId: string | null) {
  return useMemo(() => {
    if (!flows)
      return []

    return [...flows]
      .filter(flow => flow && flow.updatedAt && flow.updatedAt.getTime() > 0)
      .sort((a, b) => {
        // Always show selected flow at the top
        if (selectedFlowId) {
          if (a.id === selectedFlowId)
            return -1
          if (b.id === selectedFlowId)
            return 1
        }

        // Then sort by updatedAt
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
  }, [flows, selectedFlowId])
}
