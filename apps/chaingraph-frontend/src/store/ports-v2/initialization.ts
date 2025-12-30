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
import { trace } from '@/lib/perf-trace'
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

  // Extract ALL ports from flat map, sorted by hierarchy depth (parents before children)
  // This ensures hierarchy can be built correctly (children reference existing parents)
  const allPorts = Array.from(node.ports.values())

  // Build depth map based on parentId chains
  // Depth 0 = roots (no parentId), Depth 1 = direct children, etc.
  const depthMap = new Map<string, number>()
  const visiting = new Set<string>() // Track ports being visited to detect cycles
  const MAX_DEPTH = 50 // Safety limit

  function computeDepth(port: IPort, chainDepth: number = 0): number {
    const portId = port.id

    // Check cache first
    if (depthMap.has(portId)) {
      return depthMap.get(portId)!
    }

    // CYCLE DETECTION: Check if we're currently visiting this port
    if (visiting.has(portId)) {
      console.warn(`[PortsV2/Init] Cycle detected in parentId chain at port ${portId}`)
      depthMap.set(portId, 0) // Break cycle, treat as root
      return 0
    }

    // MAX DEPTH PROTECTION: Prevent stack overflow
    if (chainDepth >= MAX_DEPTH) {
      console.warn(`[PortsV2/Init] Max chain depth ${MAX_DEPTH} reached for port ${portId}`)
      depthMap.set(portId, MAX_DEPTH)
      return MAX_DEPTH
    }

    // Mark as visiting BEFORE recursion
    visiting.add(portId)

    const config = port.getConfig()
    const parentId = config.parentId

    // Root port (no parent)
    if (!parentId) {
      depthMap.set(portId, 0)
      visiting.delete(portId)
      return 0
    }

    // Find parent port
    const parentPort = node.getPort(parentId)
    if (!parentPort) {
      // Parent not found, treat as root
      depthMap.set(portId, 0)
      visiting.delete(portId)
      return 0
    }

    // Compute parent depth recursively
    const parentDepth = computeDepth(parentPort, chainDepth + 1)
    const depth = Math.min(parentDepth + 1, MAX_DEPTH)

    depthMap.set(portId, depth)
    visiting.delete(portId) // Remove from visiting AFTER recursion completes
    return depth
  }

  // Compute depths for all ports
  for (const port of allPorts) {
    computeDepth(port)
  }

  // Sort by depth (0 first, then 1, then 2, etc.)
  allPorts.sort((a, b) => {
    const depthA = depthMap.get(a.id) ?? 0
    const depthB = depthMap.get(b.id) ?? 0
    return depthA - depthB
  })

  // Extract in sorted order (parents first, then children)
  for (const port of allPorts) {
    events.push(extractPort(port))
  }

  if (events.length > 10) {
    console.log(`[PortsV2/Init] Extracted ${events.length} ports from ${node.id}`)
  }

  return events
}

// DEBUG: Log when this module is loaded
console.log('[ports-v2/initialization] Sample wiring registered')

/**
 * Wire: When node is added, populate granular stores from its ports
 */
sample({
  clock: addNode,
  source: $isGranularWriteEnabled,
  filter: enabled => enabled,
  fn: (_, node) => {
    console.log('[ports-v2/initialization] addNode triggered, extracting ports from:', node.id)
    return extractPortsFromNode(node)
  },
  target: portUpdatesReceived,
})

/**
 * Wire: When multiple nodes are added, populate granular stores from all ports
 */
sample({
  clock: addNodes,
  source: $isGranularWriteEnabled,
  filter: enabled => enabled,
  fn: (_, nodes) => {
    const spanId = trace.start('ports.extract.addNodes', {
      category: 'io',
      tags: { nodeCount: nodes.length },
    })
    const events = nodes.flatMap(node => extractPortsFromNode(node))
    trace.end(spanId)
    console.log(`[Ports] Extracted ${events.length} port events from ${nodes.length} nodes`)
    return events
  },
  target: portUpdatesReceived,
})

/**
 * Wire: When nodes are set (initial flow load), populate granular stores
 */
sample({
  clock: setNodes,
  source: $isGranularWriteEnabled,
  filter: enabled => enabled,
  fn: (_, nodesRecord) => {
    const nodes = Object.values(nodesRecord)
    console.log('[ports-v2/initialization] setNodes triggered, extracting ports from', nodes.length, 'nodes')
    const events = nodes.flatMap(node => extractPortsFromNode(node))
    console.log('[ports-v2/initialization] Extracted', events.length, 'port events')
    return events
  },
  target: portUpdatesReceived,
})

/** Marker to prevent tree-shaking */
export const INITIALIZATION_WIRING = true
