/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPort } from '../../port'
import type { EventContext } from '../implementations'

/**
 * Interface for managing a node's ports
 */
export interface IPortManager {
  /**
   * Get all ports of the node
   */
  readonly ports: Map<string, IPort>

  /**
   * Get a port by its ID
   * @param portId The port ID
   * @returns The port if found, undefined otherwise
   */
  getPort: (portId: string) => IPort | undefined

  /**
   * Check if a port with the given ID exists
   * @param portId The port ID
   * @returns True if the port exists, false otherwise
   */
  hasPort: (portId: string) => boolean

  /**
   * Get all input ports
   * @returns Array of input ports
   */
  getInputs: () => IPort[]

  /**
   * Get all output ports
   * @returns Array of output ports
   */
  getOutputs: () => IPort[]

  /**
   * Add or update a port
   * @param port The port to set
   * @returns The added/updated port
   */
  setPort: (port: IPort) => IPort

  /**
   * Set all ports at once
   * @param ports Map of ports to set
   */
  setPorts: (ports: Map<string, IPort>) => void

  /**
   * Remove a port by its ID
   * @param portId The ID of the port to remove
   */
  removePort: (portId: string) => void

  /**
   * Remove multiple ports by their IDs
   * @param portIds Array of port IDs to remove
   */
  removePorts: (portIds: string[]) => void

  /**
   * Find a port by following a path of property names from the node root
   * @param path Path segments (property names or array indices)
   * @returns The port if found, undefined otherwise
   */
  findPortByPath: (path: string[]) => IPort | undefined

  /**
   * Get all direct child ports of a parent port
   * @param parentPort The parent port
   * @returns Array of child ports
   */
  getChildPorts: (parentPort: IPort) => IPort[]

  /**
   * Get all nested ports of a parent port, including its children and their children recursively
   * @param parentPort The parent port
   * @returns Array of all nested ports
   */
  getNestedPorts: (parentPort: IPort) => IPort[]

  /**
   * Update a port with new configuration/value
   * @param port The port to update
   */
  updatePort: (port: IPort, eventContext?: EventContext) => void

  /**
   * Update multiple ports at once
   * @param ports Array of ports to update
   */
  updatePorts: (ports: IPort[], eventContext?: EventContext) => void

  /**
   * Find a port by a predicate function
   * @param predicate Predicate function to match the port
   * @returns The port if found, undefined otherwise
   */
  findPort: (predicate: (port: IPort) => boolean) => IPort | undefined

  /**
   * Find all ports by a predicate function
   * @param predicate Predicate function to match the port
   * @return Array of ports that match the predicate
   */
  findPorts: (predicate: (port: IPort) => boolean) => IPort[]
}
