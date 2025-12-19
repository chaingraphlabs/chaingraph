/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode, IPort } from '@badaitech/chaingraph-types'
import type { PortUIState, PortUpdateEvent } from './types'
import { sample } from 'effector'
import { addNode, addNodes, setNodes } from '@/store/nodes/stores'
import { portUpdatesReceived } from './buffer'
import { $isGranularWriteEnabled } from './feature-flags'
import { extractConfigCore, toPortKey } from './utils'

/**
 * Helper: Extract port update events from a node
 *
 * Converts a node's ports (including nested children) into PortUpdateEvent[]
 * for populating granular stores.
 *
 * CRITICAL: This must be RECURSIVE to extract child ports from ObjectPort/ArrayPort.
 * Child ports are NOT in node.ports Map - they're accessed via node.getChildPorts(port).
 *
 * @param node - The node containing ports to extract
 * @returns Array of port update events (root + all children recursively)
 */
function extractPortsFromNode(node: INode): PortUpdateEvent[] {
  const events: PortUpdateEvent[] = []

  // Helper to extract a single port's data
  function extractPort(port: IPort): PortUpdateEvent {
    const portKey = toPortKey(node.id, port.id)
    const config = port.getConfig()

    return {
      portKey,
      nodeId: node.id,
      portId: port.id,
      timestamp: Date.now(),
      source: 'local-optimistic',
      version: node.getVersion(),
      changes: {
        value: port.getValue(),
        config: extractConfigCore(config),
        ui: (config.ui ?? {}) as PortUIState,
        connections: config.connections || [],
      },
    }
  }

  // Helper to recursively extract port and all its children
  function extractPortAndChildren(port: IPort): void {
    // Extract the port itself
    events.push(extractPort(port))

    // Recursively extract child ports (for ObjectPort/ArrayPort)
    // Child ports have IDs like 'myPort.0', 'myPort.field' (dot notation)
    const childPorts = node.getChildPorts(port)
    for (const childPort of childPorts) {
      extractPortAndChildren(childPort) // Recursion handles deep nesting
    }
  }

  // Iterate root-level ports and extract them + their children
  for (const port of node.ports.values()) {
    extractPortAndChildren(port)
  }

  if (events.length > 10) {
    console.log(`[PortsV2/Init] Extracted ${events.length} ports from ${node.id}`)
  }

  return events
}

/**
 * Wire: When node is added, populate granular stores from its ports
 */
sample({
  clock: addNode,
  source: $isGranularWriteEnabled,
  filter: (enabled) => enabled,
  fn: (_, node) => extractPortsFromNode(node),
  target: portUpdatesReceived,
})

/**
 * Wire: When multiple nodes are added, populate granular stores from all ports
 */
sample({
  clock: addNodes,
  source: $isGranularWriteEnabled,
  filter: (enabled) => enabled,
  fn: (_, nodes) => nodes.flatMap(node => extractPortsFromNode(node)),
  target: portUpdatesReceived,
})

/**
 * Wire: When nodes are set (initial flow load), populate granular stores
 */
sample({
  clock: setNodes,
  source: $isGranularWriteEnabled,
  filter: (enabled) => enabled,
  fn: (_, nodesRecord) => {
    const nodes = Object.values(nodesRecord)
    return nodes.flatMap(node => extractPortsFromNode(node))
  },
  target: portUpdatesReceived,
})
