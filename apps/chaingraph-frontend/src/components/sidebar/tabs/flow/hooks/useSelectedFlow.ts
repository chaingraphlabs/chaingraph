/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { FlowMetadata } from '@badaitech/chaingraph-types'
import { trpcReact } from '@badaitech/chaingraph-trpc/client'
import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'chaingraph:selected-flow'

export function useSelectedFlow() {
  // Get initial flow ID from localStorage
  const [storedFlowId, setStoredFlowId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to read from localStorage:', error)
      return null
    }
  })

  // Query for selected flow
  const {
    data: selectedFlow,
    isLoading,
    error,
  } = trpcReact.flow.getMeta.useQuery({
    flowId: storedFlowId!,
  }, {
    enabled: Boolean(storedFlowId),
  })

  // Handle flow selection/deselection
  const setSelectedFlow = useCallback((flow: FlowMetadata | null) => {
    try {
      if (flow?.id) {
        localStorage.setItem(STORAGE_KEY, flow.id)
        setStoredFlowId(flow.id)
      } else {
        localStorage.removeItem(STORAGE_KEY)
        setStoredFlowId(null)
      }
    } catch (error) {
      console.error('Failed to update localStorage:', error)
    }
  }, [])

  // Clear selection if flow no longer exists
  useEffect(() => {
    if (error && storedFlowId) {
      localStorage.removeItem(STORAGE_KEY)
      setStoredFlowId(null)
    }
  }, [error, storedFlowId])

  return useMemo(() => ({
    selectedFlow: error || isLoading ? undefined : selectedFlow ?? undefined,
    setSelectedFlow,
    isLoading: isLoading && Boolean(storedFlowId),
  }), [error, selectedFlow, setSelectedFlow, isLoading, storedFlowId])
}
