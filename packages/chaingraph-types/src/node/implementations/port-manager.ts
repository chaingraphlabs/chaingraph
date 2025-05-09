/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPort } from '../../port'
import type { IPortManager } from '../interfaces'
import { PortDirection } from '../../port'

/**
 * Implementation of IPortManager interface
 * Handles management of ports for a node
 */
export class PortManager implements IPortManager {
  protected _ports: Map<string, IPort> = new Map()

  constructor(initialPorts?: Map<string, IPort>) {
    if (initialPorts) {
      this._ports = new Map(initialPorts)
    }
  }

  /**
   * Get all ports of the node
   */
  get ports(): Map<string, IPort> {
    return this._ports
  }

  /**
   * Get a port by its ID
   * @param portId The port ID
   * @returns The port if found, undefined otherwise
   */
  getPort(portId: string): IPort | undefined {
    return this._ports.get(portId)
  }

  /**
   * Check if a port with the given ID exists
   * @param portId The port ID
   * @returns True if the port exists, false otherwise
   */
  hasPort(portId: string): boolean {
    return this._ports.has(portId)
  }

  /**
   * Get all input ports
   * @returns Array of input ports
   */
  getInputs(): IPort[] {
    return Array.from(
      this._ports
        .values()
        .filter(port => port.getConfig().direction === PortDirection.Input),
    )
  }

  /**
   * Get all output ports
   * @returns Array of output ports
   */
  getOutputs(): IPort[] {
    return Array.from(
      this._ports.values()
        .filter(port => port.getConfig().direction === PortDirection.Output),
    )
  }

  /**
   * Add or update a port
   * @param port The port to set
   * @returns The added/updated port
   */
  setPort(port: IPort): IPort {
    if (!port.id) {
      throw new Error('Port ID is required.')
    }

    this._ports.set(port.id, port)
    return port
  }

  /**
   * Set all ports at once
   * @param ports Map of ports to set
   */
  setPorts(ports: Map<string, IPort>): void {
    this._ports = ports
  }

  /**
   * Remove a port by its ID
   * @param portId The ID of the port to remove
   */
  removePort(portId: string): void {
    // remove all child ports first
    for (const port of this._ports.values()) {
      if (port.getConfig().parentId === portId) {
        this.removePort(port.id)
      }
    }

    // remove the port itself
    if (!this._ports.delete(portId)) {
      // throw new Error(`Port with ID ${portId} does not exist.`)
      // just ignore the error
    }
  }

  /**
   * Find a port by following a path of property names from the node root
   * @param path Path segments (property names or array indices)
   * @returns The port if found, undefined otherwise
   */
  findPortByPath(path: string[]): IPort | undefined {
    if (path.length === 0) {
      return undefined
    }

    // Find the root port first
    const rootKey = path[0]
    let currentPort: IPort | undefined

    // Find root port by key
    for (const port of this._ports.values()) {
      if (!port.getConfig().parentId && port.getConfig().key === rootKey) {
        currentPort = port
        break
      }
    }

    if (!currentPort) {
      return undefined
    }

    // Follow the path to find the target port
    for (let i = 1; i < path.length; i++) {
      const segment = path[i]
      const isArrayIndex = segment.match(/^\d+$/)

      // Build the expected port ID based on the current port
      const nextPortId = isArrayIndex
        ? `${currentPort.id}[${segment}]`
        : `${currentPort.id}.${segment}`

      currentPort = this._ports.get(nextPortId)
      if (!currentPort) {
        return undefined
      }
    }

    return currentPort
  }

  /**
   * Get all direct child ports of a parent port
   * @param parentPort The parent port
   * @returns Array of child ports
   */
  getChildPorts(parentPort: IPort): IPort[] {
    const parentId = parentPort.id

    return Array.from(this._ports.values())
      .filter(port => port.getConfig().parentId === parentId)
  }

  /**
   * Update a port with new configuration/value
   * @param port The port to update
   */
  updatePort(port: IPort): void {
    // if (!this._ports.has(port.id)) {
    //   throw new Error(`Port with ID ${port.id} does not exist.`)
    // }

    this._ports.set(port.id, port)
  }
}
