/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPort } from '../../port'
import type { IPortManager } from '../interfaces'
import { generatePortIDArrayElement, PortDirection } from '../../port'

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
    return Array.from(this._ports.values())
      .filter(port => port.getConfig().direction === PortDirection.Input)
  }

  /**
   * Get all output ports
   * @returns Array of output ports
   */
  getOutputs(): IPort[] {
    return Array.from(this._ports.values())
      .filter(port => port.getConfig().direction === PortDirection.Output)
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
    // remove all nested ports that have this port as parent
    const port = this._ports.get(portId)
    if (!port) {
      // throw new Error(`Port with ID ${portId} does not exist.`)
      // just ignore the error for now
      return
    }

    const nestedPorts = this.getNestedPorts(port)
    for (const nestedPort of nestedPorts) {
      this._ports.delete(nestedPort.id)
    }

    // remove the port itself
    if (!this._ports.delete(portId)) {
      // throw new Error(`Port with ID ${portId} does not exist.`)
      // just ignore the error for now
    }
  }

  /**
   * Remove multiple ports by their IDs
   * @param portIds Array of port IDs to remove
   */
  removePorts(portIds: string[]): void {
    for (const portId of portIds) {
      this.removePort(portId)
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
        ? generatePortIDArrayElement(currentPort.id, Number.parseInt(segment))
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
   * Get all nested ports of a parent port, including its children and their children recursively
   * @param parentPort The parent port
   * @returns Array of all nested ports
   */
  getNestedPorts(parentPort: IPort): IPort[] {
    const childPorts = this.getChildPorts(parentPort)
    const nestedPorts: IPort[] = []

    for (const child of childPorts) {
      nestedPorts.push(...this.getNestedPorts(child))
    }
    nestedPorts.push(...childPorts)

    return nestedPorts
  }

  /**
   * Update a port with new configuration/value
   * @param port The port to update
   */
  updatePort(port: IPort): void {
    this._ports.set(port.id, port)
  }

  /**
   * Update multiple ports at once
   * @param ports Array of ports to update
   */
  updatePorts(ports: IPort[]): void {
    for (const port of ports) {
      this.updatePort(port)
    }
  }

  /**
   * Find a port by a predicate function
   * @param predicate Predicate function to match the port
   * @returns The first matching port or undefined
   */
  findPort(predicate: (port: IPort) => boolean): IPort | undefined {
    for (const port of this._ports.values()) {
      if (predicate(port)) {
        return port
      }
    }
    return undefined
  }

  // findPorts: (predicate: (port: IPort) => boolean) => IPort[]/**/
  /**
   * Find all ports by a predicate function
   * @param predicate Predicate function to match the port
   * @returns Array of ports that match the predicate
   */
  findPorts(predicate: (port: IPort) => boolean): IPort[] {
    const matchingPorts: IPort[] = []
    for (const port of this._ports.values()) {
      if (predicate(port)) {
        matchingPorts.push(port)
      }
    }
    return matchingPorts
  }
}
