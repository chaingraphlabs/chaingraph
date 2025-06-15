/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useCallback } from 'react'
import { blurPortEditor, focusPortEditor } from '../stores'

/**
 * Hook for tracking focus/blur events on port editors
 * Provides callbacks to register focus and blur events for a specific node/port combination
 */
export function useFocusTracking(nodeId: string, portId: string) {
  const handleFocus = useCallback(() => {
    focusPortEditor({ nodeId, portId })
  }, [nodeId, portId])

  const handleBlur = useCallback(() => {
    blurPortEditor({ nodeId, portId })
  }, [nodeId, portId])

  return {
    handleFocus,
    handleBlur,
  }
}
