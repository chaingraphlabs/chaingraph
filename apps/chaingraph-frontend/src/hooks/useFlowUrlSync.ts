/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useUnit } from 'effector-react'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { $activeFlowId, setActiveFlowId } from '../store/flow'

export function useFlowUrlSync() {
  const { flowId } = useParams()
  const activeFlowId = useUnit($activeFlowId)

  // Only sync URL to store on initial load, not on every change
  // This prevents React StrictMode double-invoke issues
  useEffect(() => {
    // Only set if we have a URL flowId and no active flow (initial load)
    if (flowId && activeFlowId === null) {
      console.debug(`[URL SYNC] Initial load: setting active flow to ${flowId}`)
      setActiveFlowId(flowId)
    }
  }, [flowId]) // Remove activeFlowId from deps to avoid loops
}
