/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPort, IPortConfig } from '../../port'

/**
 * Interface for managing default system ports of a node
 */
export interface IDefaultPortManager {
  /**
   * Get all default ports based on the node's flow configuration
   */
  getDefaultPorts: () => IPort[]

  /**
   * Get default port configurations
   */
  getDefaultPortConfigs: () => IPortConfig[]

  /**
   * Check if a port is a system default port
   */
  isDefaultPort: (portId: string) => boolean

  /**
   * Get flow in port
   */
  getFlowInPort: () => IPort | undefined

  /**
   * Get flow out port
   */
  getFlowOutPort: () => IPort | undefined

  /**
   * Get error port
   */
  getErrorPort: () => IPort | undefined

  /**
   * Get error message port
   */
  getErrorMessagePort: () => IPort | undefined

  /**
   * Determine if node should execute based on flow ports
   */
  shouldExecute: () => boolean

  /**
   * Update flow ports after execution
   */
  updatePortsAfterExecution: (success: boolean, errorMessage?: string) => Promise<void>
}
