/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPort, IPortConfig } from '../../port'
import type { IComplexPortHandler } from './icomplex-port-handler'

/**
 * Interface for binding ports to object properties
 */
export interface IPortBinder {
  /**
   * Set the complex port handler (to avoid circular dependencies)
   */
  setComplexPortHandler: (handler: IComplexPortHandler) => void

  /**
   * Bind a port to an object property
   * @param targetObject The object to bind the port to
   * @param port The port to bind
   */
  bindPortToNodeProperty: (targetObject: any, port: IPort) => void

  /**
   * Initialize all ports from configs and establish property bindings
   * @param portsConfigs Map of port configurations
   */
  initializePortsFromConfigs: (portsConfigs: Map<string, IPortConfig>) => void

  /**
   * Bind all port bindings
   * Call this after modifying port structure
   */
  bindPortBindings: () => void

  /**
   * Process a port config through the PortConfigProcessor
   */
  processPortConfig: (config: IPortConfig, context: {
    nodeId: string
    parentPortConfig: IPortConfig | null
    propertyKey: string
    propertyValue: any
  }) => IPortConfig
}
