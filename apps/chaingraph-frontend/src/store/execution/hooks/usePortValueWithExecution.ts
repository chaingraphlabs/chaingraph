/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPortConfig } from '@badaitech/chaingraph-types'
import type { PortConfigFull, PortUIState } from '@/store/ports-v2/types'
import { usePortConfig, usePortUI, usePortValue } from '@/store/ports-v2'
import { useNodeExecution } from './useNodeExecution'

/**
 * Hook to get port value with execution-aware behavior.
 *
 * Priority order:
 * 1. If node has active execution state -> return runtime value from executed node
 * 2. Otherwise -> return design-time value from regular stores
 *
 * This ensures that port tooltips show actual runtime values during execution,
 * while falling back to design-time values when not executing.
 *
 * @param nodeId - The node ID
 * @param portId - The port ID
 * @returns The port value (runtime if executing, design-time otherwise)
 *
 * @example
 * ```tsx
 * // In a port documentation component:
 * const value = usePortValueWithExecution(nodeId, portId)
 * // During execution: shows runtime value
 * // Outside execution: shows design-time value
 * ```
 */
export function usePortValueWithExecution(
  nodeId: string,
  portId: string,
): unknown | undefined {
  // Get execution state for this node (if any)
  const nodeExecution = useNodeExecution(nodeId)

  // Get design-time value from regular stores (fallback)
  const designValue = usePortValue(nodeId, portId)

  // If there's an active execution with a node instance, try to get runtime value
  if (nodeExecution?.node) {
    try {
      // Get the port from the executed node
      const port = nodeExecution.node.getPort(portId)

      if (port) {
        // Get the runtime value from the executed port
        const runtimeValue = port.getValue()

        // Only use runtime value if it's actually defined
        // (undefined means port exists but has no value set)
        if (runtimeValue !== undefined) {
          return runtimeValue
        }
      }
    } catch (error) {
      // If there's an error accessing the execution node/port,
      // fall back to design-time value
      console.warn(
        `Failed to get execution value for port ${portId} on node ${nodeId}:`,
        error,
      )
    }
  }

  // Fallback: return design-time value
  return designValue
}

/**
 * Hook to get port configuration with execution-aware behavior.
 *
 * Priority order:
 * 1. If node has active execution state -> return runtime config from executed node
 * 2. Otherwise -> return design-time config from regular stores
 *
 * Port configurations can change during execution (rare case):
 * - Dynamic ports can be added/removed
 * - Visibility rules can change based on execution state
 * - Schema validation rules might be adjusted
 *
 * @param nodeId - The node ID
 * @param portId - The port ID
 * @returns The port configuration (runtime if executing, design-time otherwise)
 *
 * @example
 * ```tsx
 * // In a port documentation component:
 * const config = usePortConfigWithExecution(nodeId, portId)
 * // During execution: shows runtime config (with any dynamic changes)
 * // Outside execution: shows design-time config
 * ```
 */
export function usePortConfigWithExecution(
  nodeId: string,
  portId: string,
): PortConfigFull | undefined {
  // Get execution state for this node (if any)
  const nodeExecution = useNodeExecution(nodeId)

  // Get design-time config from regular stores (fallback)
  const designConfig = usePortConfig(nodeId, portId)

  // If there's an active execution with a node instance, try to get runtime config
  if (nodeExecution?.node) {
    try {
      // Get the port from the executed node
      const port = nodeExecution.node.getPort(portId)

      if (port) {
        // Get the runtime configuration from the executed port
        const runtimeConfig = port.getConfig() as PortConfigFull

        // Always prefer runtime config if port exists in execution
        if (runtimeConfig) {
          return runtimeConfig
        }
      }
    } catch (error) {
      // If there's an error accessing the execution node/port,
      // fall back to design-time config
      console.warn(
        `Failed to get execution config for port ${portId} on node ${nodeId}:`,
        error,
      )
    }
  }

  // Fallback: return design-time config
  return designConfig
}

/**
 * Hook to get port UI state with execution-aware behavior.
 *
 * Priority order:
 * 1. If node has active execution state -> extract UI from runtime config
 * 2. Otherwise -> return design-time UI from regular stores
 *
 * Port UI can change during execution (rare case):
 * - Collapsed/expanded state might be programmatically changed
 * - Hidden/disabled states can be toggled based on execution logic
 * - UI hints (slider, textarea, etc.) might be adjusted dynamically
 *
 * @param nodeId - The node ID
 * @param portId - The port ID
 * @returns The port UI state (runtime if executing, design-time otherwise)
 *
 * @example
 * ```tsx
 * // In a port documentation component:
 * const ui = usePortUIWithExecution(nodeId, portId)
 * // During execution: shows runtime UI state
 * // Outside execution: shows design-time UI state
 * ```
 */
export function usePortUIWithExecution(
  nodeId: string,
  portId: string,
): PortUIState {
  // Get execution state for this node (if any)
  const nodeExecution = useNodeExecution(nodeId)

  // Get design-time UI from regular stores (fallback)
  const designUI = usePortUI(nodeId, portId)

  // If there's an active execution with a node instance, try to get runtime UI
  if (nodeExecution?.node) {
    try {
      // Get the port from the executed node
      const port = nodeExecution.node.getPort(portId)

      if (port) {
        // Get the runtime configuration from the executed port
        const runtimeConfig = port.getConfig() as IPortConfig

        // Extract UI from the config (UI is stored in config.ui)
        if (runtimeConfig?.ui) {
          return {
            ...designUI,
            ...runtimeConfig.ui as PortUIState,
          }
        }
      }
    } catch (error) {
      // If there's an error accessing the execution node/port,
      // fall back to design-time UI
      console.warn(
        `Failed to get execution UI for port ${portId} on node ${nodeId}:`,
        error,
      )
    }
  }

  // Fallback: return design-time UI
  return designUI
}
