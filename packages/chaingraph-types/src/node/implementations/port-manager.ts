/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EventContext } from '../../node/implementations/node-event-manager'
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
    // Validate input
    if (!path || path.length === 0) {
      return undefined
    }

    // Validate path segments
    for (const segment of path) {
      if (!segment || typeof segment !== 'string') {
        console.warn(`Invalid path segment: ${segment}`)
        return undefined
      }
      // Check for empty or whitespace-only segments
      if (!segment.trim()) {
        console.warn(`Empty path segment in path: ${path.join('.')}`)
        return undefined
      }
    }

    // Find the root port first
    const rootKey = path[0].trim()
    let currentPort: IPort | undefined

    // Find root port by key (this is still O(n) but can be optimized with indexing)
    for (const port of this._ports.values()) {
      const config = port.getConfig()
      if (!config.parentId && config.key === rootKey) {
        currentPort = port
        break
      }
    }

    if (!currentPort) {
      return undefined
    }

    // Follow the path to find the target port
    for (let i = 1; i < path.length; i++) {
      const segment = path[i].trim()

      // Check if segment is an array index
      const isArrayIndex = /^\d+$/.test(segment)

      if (isArrayIndex) {
        const index = Number.parseInt(segment, 10)

        // Validate array index
        if (index < 0 || index > Number.MAX_SAFE_INTEGER) {
          console.warn(`Invalid array index: ${index}`)
          return undefined
        }

        // Build the expected port ID for array element
        const nextPortId = generatePortIDArrayElement(currentPort.id, index)
        currentPort = this._ports.get(nextPortId)
      } else {
        // Validate that segment doesn't contain invalid characters
        if (segment.includes('.') || segment.includes('[') || segment.includes(']')) {
          console.warn(`Invalid characters in path segment: ${segment}`)
          return undefined
        }

        // Build the expected port ID for object property
        const nextPortId = `${currentPort.id}.${segment}`
        currentPort = this._ports.get(nextPortId)
      }

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
      .filter(port => 'getConfig' in port && port.getConfig().parentId === parentId)
  }

  /**
   * Get all nested ports of a parent port, including its children and their children recursively
   * @param parentPort The parent port
   * @returns Array of all nested ports
   */
  getNestedPorts(parentPort: IPort): IPort[] {
    const result: IPort[] = []
    const toProcess: string[] = [parentPort.id]
    const processed = new Set<string>()

    // Single-pass collection using BFS approach
    while (toProcess.length > 0) {
      const currentId = toProcess.shift()!

      // Skip if already processed (handles potential cycles)
      if (processed.has(currentId)) {
        continue
      }
      processed.add(currentId)

      // Find all children of current port in a single iteration
      for (const port of this._ports.values()) {
        if (port.getConfig().parentId === currentId) {
          result.push(port)
          toProcess.push(port.id)
        }
      }
    }

    return result
  }

  /**
   * Get the full parentship chain of a port, from the port up to the root
   * @param port The port to get the chain for
   * @returns Array of ports in the chain, starting from the given port up to the root
   */
  getParentshipChain(port: IPort): IPort[] {
    const chain: IPort[] = []
    const visited = new Set<string>()
    let currentPort: IPort | undefined = port

    // Traverse up the parent chain
    while (currentPort) {
      // Cycle detection
      if (visited.has(currentPort.id)) {
        console.warn(`Cycle detected in port parentship chain at port ${currentPort.id}`)
        break
      }

      chain.push(currentPort)
      visited.add(currentPort.id)

      // Get parent port
      const parentId = currentPort.getConfig().parentId
      if (!parentId) {
        break // Reached root
      }

      currentPort = this._ports.get(parentId)
    }

    return chain
  }

  /**
   * Get the root port of a given port by traversing up the parentship chain
   * @param port The port to find the root for
   * @returns The root port
   */
  getRootPort(port: IPort): IPort {
    const visited = new Set<string>()
    let currentPort: IPort = port

    // Traverse up to find the root
    while (currentPort.getConfig().parentId) {
      // Cycle detection
      if (visited.has(currentPort.id)) {
        console.warn(`Cycle detected in port parentship chain at port ${currentPort.id}`)
        return currentPort // Return current to avoid infinite loop
      }
      visited.add(currentPort.id)

      const parentPort = this._ports.get(currentPort.getConfig().parentId!)
      if (!parentPort) {
        break // Parent not found, current is effectively root
      }

      currentPort = parentPort
    }

    return currentPort
  }

  /**
   * Update a port with new configuration/value
   * @param port The port to update
   * @param eventContext Optional event context for the update
   */
  updatePort(port: IPort, eventContext?: EventContext): void {
    this._ports.set(port.id, port)
  }

  /**
   * Update multiple ports at once
   * @param ports Array of ports to update
   * @param eventContext Optional event context for the update
   */
  updatePorts(ports: IPort[], eventContext?: EventContext): void {
    for (const port of ports) {
      this.updatePort(port, eventContext)
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

  /**
   * Parse a path string into segments
   * Handles both dot notation and array notation
   * @param pathString The path string (e.g., "port.array[0].field")
   * @returns Array of path segments
   */
  protected parsePathString(pathString: string): string[] {
    const segments: string[] = []
    let current = ''
    let i = 0

    while (i < pathString.length) {
      const char = pathString[i]

      if (char === '.') {
        if (current) {
          segments.push(current)
          current = ''
        }
        i++
      } else if (char === '[') {
        // Save current segment if exists
        if (current) {
          segments.push(current)
          current = ''
        }
        // Find closing bracket
        const closeIndex = pathString.indexOf(']', i)
        if (closeIndex === -1) {
          throw new Error(`Invalid path: unclosed bracket at position ${i}`)
        }
        // Extract array index
        const index = pathString.slice(i + 1, closeIndex)
        segments.push(index)
        i = closeIndex + 1
      } else {
        current += char
        i++
      }
    }

    // Add last segment if exists
    if (current) {
      segments.push(current)
    }

    return segments
  }

  /**
   * Get a port by its path string
   * @param pathString The path string to the port
   * @returns The port if found, undefined otherwise
   */
  getPortByPath(pathString: string): IPort | undefined {
    if (!pathString) {
      return undefined
    }

    try {
      const segments = this.parsePathString(pathString)
      return this.findPortByPath(segments)
    } catch (error) {
      console.warn(`Failed to parse path: ${pathString}`, error)
      return undefined
    }
  }

  /**
   * Build the path for a port by traversing up the parent chain
   * @param port The port to build the path for
   * @returns The path segments from root to this port
   */
  protected buildPortPath(port: IPort): string[] {
    const segments: string[] = []
    let currentPort: IPort | undefined = port

    // Build path from port to root
    while (currentPort) {
      const key = currentPort.getConfig().key
      if (key) {
        segments.unshift(key)
      }

      const parentId = currentPort.getConfig().parentId
      if (!parentId) {
        break // Reached root
      }

      currentPort = this._ports.get(parentId)
    }

    return segments
  }

  /**
   * Convert path segments to a path string
   * @param segments The path segments
   * @returns The path string with proper notation
   */
  protected segmentsToPathString(segments: string[]): string {
    let result = ''

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]

      // Check if segment is a number (array index)
      if (/^\d+$/.test(segment)) {
        // Array indices are wrapped in brackets
        result += `[${segment}]`
      } else {
        // Property names need a dot separator unless:
        // 1. We're at the start (result is empty)
        // 2. The last character is already a dot
        if (result && !result.endsWith('.')) {
          result += '.'
        }
        result += segment
      }
    }

    return result
  }

  /**
   * Get the full path string for a given port
   * @param portId The ID of the port
   * @returns The path string or undefined if port not found
   */
  getPortPath(portId: string): string | undefined {
    const port = this._ports.get(portId)
    if (!port) {
      return undefined
    }

    const segments = this.buildPortPath(port)
    return this.segmentsToPathString(segments)
  }

  /**
   * Get the full path string for a given port instance
   * @param port The port instance
   * @returns The path string
   */
  getPortPathForPort(port: IPort): string {
    const segments = this.buildPortPath(port)
    return this.segmentsToPathString(segments)
  }
}
