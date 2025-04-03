/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPort } from '../port'
import type { INode } from './interface'

/**
 * Traverse all ports of a node
 * @param node Node to traverse
 * @param visitor Visitor function
 */
export function traversePorts(node: INode, visitor: (port: IPort) => void | Promise<void>) {
  for (const port of node.ports.values()) {
    visitor(port)
  }
}

/**
 * Filter ports of a node
 * @param node Node to filter
 * @param predicate Predicate function
 * @returns Filtered ports
 */
export function filterPorts(node: INode, predicate: (port: IPort) => boolean): IPort[] {
  const ports: IPort[] = []
  traversePorts(node, (port) => {
    if (predicate(port)) {
      ports.push(port)
    }
  })
  return ports
}

/**
 * Find a port of a node
 * @param node Node to search
 * @param predicate Predicate function
 * @returns Found port or undefined
 */
export function findPort(node: INode, predicate: (port: IPort) => boolean): IPort | undefined {
  let foundPort: IPort | undefined
  traversePorts(node, (port) => {
    if (predicate(port)) {
      foundPort = port
    }
  })
  return foundPort
}

/**
 * Find a port by port config.key
 * @param node Node to search
 * @param key Key to search
 * @returns Found port or undefined
 */
export function findPortByKey(node: INode, key: string): IPort | undefined {
  return findPort(node, port => port.getConfig().key === key)
}

/**
 * Map ports of a node
 * @param node Node to map
 * @param mapper Mapper function
 * @returns Mapped ports
 */
export function mapPorts(node: INode, mapper: (port: IPort) => IPort): IPort[] {
  const mappedPorts: IPort[] = []
  traversePorts(node, (port) => {
    mappedPorts.push(mapper(port))
  })
  return mappedPorts
}

/**
 * Reduce ports of a node
 * @param node Node to reduce
 * @param reducer Reducer function
 * @param initialValue Initial value
 * @returns Reduced value
 */
export function reducePorts<T>(node: INode, reducer: (accumulator: T, port: IPort) => T, initialValue: T): T {
  let accumulator = initialValue
  traversePorts(node, (port) => {
    accumulator = reducer(accumulator, port)
  })
  return accumulator
}
