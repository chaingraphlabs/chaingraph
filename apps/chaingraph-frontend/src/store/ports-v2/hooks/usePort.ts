/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { usePortConfig } from './usePortConfig'
import { usePortConnections } from './usePortConnections'
import { usePortUI } from './usePortUI'
import { usePortValue } from './usePortValue'

/**
 * Combined hook for components that need multiple port concerns
 *
 * Returns all port data with granular subscriptions.
 * Each concern (value, UI, config, connections) is subscribed independently,
 * so component only re-renders when the specific data it uses changes.
 *
 * @param nodeId - The node ID
 * @param portId - The port ID
 * @returns Object with value, UI, config, and connections
 */
export function usePort(nodeId: string, portId: string) {
  const value = usePortValue(nodeId, portId)
  const ui = usePortUI(nodeId, portId)
  const config = usePortConfig(nodeId, portId)
  const connections = usePortConnections(nodeId, portId)

  return { value, ui, config, connections }
}
