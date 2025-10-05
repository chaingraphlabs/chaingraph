/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '../node'
import type { Connection, IPort, PortType } from '../port'
import type { IFlow } from './interface'
import { Edge } from '../edge'
import { filterPorts } from '../node'

/**
 * Flow migration utilities for handling schema version upgrades
 */
export class FlowMigration {
  /**
   * Migrate flow from schema v1 to v2
   * Changes port ID format from "key:PO[16chars]" to just "key"
   * System ports preserve their __ prefix
   */
  static migrateFlowFromV1ToV2(flow: IFlow): IFlow {
    // nodePortsMapping has key as nodeId and value as map of oldPortId to newPortId
    const nodePortsMapping: Record<string, Record<string, string>> = {}
    let totalPortsMigrated = 0
    let totalPortsUnchanged = 0

    // iterate over all nodes and their ports
    flow.nodes.forEach((node) => {
      const migrateResult = this.migrateNodeFromV1ToV2(node, flow)
      nodePortsMapping[node.id] = migrateResult.portsIdsMapping

      const changedCount = Object.keys(migrateResult.portsIdsMapping).length
      const totalCount = node.ports.size
      totalPortsMigrated += changedCount
      totalPortsUnchanged += (totalCount - changedCount)
    })

    // now update all edges with new port ids
    let edgesMigrated = 0
    let edgesUnchanged = 0

    const newEdges = Array.from(flow.edges.values())
      .map((edge) => {
        const sourceNode = flow.nodes.get(edge.sourceNode.id)
        const targetNode = flow.nodes.get(edge.targetNode.id)

        if (!sourceNode || !targetNode) {
          throw new Error(`[Flow Migration] Failed to migrate flow: source or target node not found for edge ${edge.id}`)
        }

        const sourcePortMapping = nodePortsMapping[edge.sourceNode.id]
        const targetPortMapping = nodePortsMapping[edge.targetNode.id]

        if (!sourcePortMapping || !targetPortMapping) {
          throw new Error(`[Flow Migration] Failed to migrate flow: source or target port mapping not found for edge ${edge.id}`)
        }

        const oldSourcePortId = edge.sourcePort.id
        const oldTargetPortId = edge.targetPort.id
        const newSourcePortId = sourcePortMapping[oldSourcePortId] || oldSourcePortId
        const newTargetPortId = targetPortMapping[oldTargetPortId] || oldTargetPortId

        const sourceChanged = newSourcePortId !== oldSourcePortId
        const targetChanged = newTargetPortId !== oldTargetPortId

        if (sourceChanged || targetChanged) {
          edgesMigrated++
        } else {
          edgesUnchanged++
        }

        const newSourcePort = sourceNode.getPort(newSourcePortId)
        const newTargetPort = targetNode.getPort(newTargetPortId)

        if (!newSourcePort) {
          console.error(`❌ Source port not found: ${newSourcePortId} on node ${sourceNode.id}`)
          console.error(`   Available ports: ${Array.from(sourceNode.ports.keys()).join(', ')}`)
          throw new Error(`[Flow Migration] Failed to migrate flow: new source port not found on node ${sourceNode.id} for edge ${edge.id}: ${newSourcePortId}`)
        }
        if (!newTargetPort) {
          console.error(`❌ Target port not found: ${newTargetPortId} on node ${targetNode.id}`)
          console.error(`   Available ports: ${Array.from(targetNode.ports.keys()).join(', ')}`)
          throw new Error(`[Flow Migration] Failed to migrate flow: new target port not found on node ${targetNode.id} for edge ${edge.id}: ${newTargetPortId}`)
        }

        // fix the port connections
        const newSourcePortConnections = newSourcePort.getConfig().connections?.map((conn) => {
          const newPortId = nodePortsMapping[conn.nodeId]?.[conn.portId] || conn.portId
          return { nodeId: conn.nodeId, portId: newPortId } as Connection
        }) || undefined

        newSourcePort.setConfig({
          ...newSourcePort.getConfig(),
          connections: newSourcePortConnections,
        })

        const newTargetPortConnections = newTargetPort.getConfig().connections?.map((conn) => {
          const newPortId = nodePortsMapping[conn.nodeId]?.[conn.portId] || conn.portId
          return { nodeId: conn.nodeId, portId: newPortId } as Connection
        }) || undefined

        newTargetPort.setConfig({
          ...newTargetPort.getConfig(),
          connections: newTargetPortConnections,
        })

        return new Edge(
          edge.id,
          sourceNode,
          newSourcePort,
          targetNode,
          newTargetPort,
          edge.metadata,
        )
      })

    flow.setEdges(newEdges)

    flow.metadata.schemaVersion = 'v2'
    flow.metadata.updatedAt = new Date()

    return flow
  }

  private static migrateNodeFromV1ToV2(node: INode, flow: IFlow): {
    node: INode
    portsIdsMapping: Record<string, string>
  } {
    // mapping from old port id to new port id
    const portsIdsMapping: Record<string, string> = {}
    const portDetails: Array<{ old: string, new: string, type: string, level: number }> = []

    // Create a new Map to hold all ports (changed and unchanged)
    const newPorts: Map<string, IPort> = new Map()

    // First pass: Update all port IDs and build mapping
    node.ports.forEach((port) => {
      const portConfig = port.getConfig()
      // Skip child ports in the first pass (they'll be handled recursively)
      if (portConfig.parentId) {
        return
      }

      const oldPortId = port.id
      // For system ports, preserve the __ prefix
      const isSystemPort = portConfig.metadata?.isSystemPort === true
      const newPortId = isSystemPort
        ? this.replacePortIdSchemaForSystemPort(oldPortId, portConfig.key || '')
        : portConfig.key || this.replacePortIdSchema(oldPortId)
      const isPortIdChanged = oldPortId !== newPortId

      if (isPortIdChanged) {
        port.setConfig({
          ...port.getConfig(),
          id: newPortId,
        })
        portsIdsMapping[oldPortId] = newPortId
        portDetails.push({
          old: oldPortId,
          new: newPortId,
          type: portConfig.type,
          level: 0,
        })
      }

      // Add port to new collection regardless of whether ID changed
      newPorts.set(isPortIdChanged ? newPortId : oldPortId, port)

      // Recursively update child ports
      const recursivelyUpdateChildPorts = (parentPort: IPort, parentOldId: string, level: number = 1) => {
        const typesWithChildren: PortType[] = ['object', 'array', 'any', 'stream']
        const parentPortConfig = parentPort.getConfig()

        if (!typesWithChildren.includes(parentPortConfig.type)) {
          return
        }

        // Find children using the old parent ID
        const children = filterPorts(node, (p) => {
          return p.getConfig().parentId === parentOldId
        })

        children.forEach((childPort) => {
          const oldChildPortId = childPort.id
          const newChildPortId
            = parentPortConfig.type === 'array'
              ? `${parentPortConfig.id}[${childPort.getConfig().key}]`
              : `${parentPortConfig.id}.${childPort.getConfig().key}`

          const isChildPortIdChanged = oldChildPortId !== newChildPortId

          if (isChildPortIdChanged) {
            childPort.setConfig({
              ...childPort.getConfig(),
              id: newChildPortId,
              parentId: parentPortConfig.id, // Update to new parent ID
            })
            portsIdsMapping[oldChildPortId] = newChildPortId
            portDetails.push({
              old: oldChildPortId,
              new: newChildPortId,
              type: childPort.getConfig().type,
              level,
            })
          } else {
            // Even if ID didn't change, update parentId to new parent ID
            childPort.setConfig({
              ...childPort.getConfig(),
              parentId: parentPortConfig.id,
            })
          }

          // Add child port to new collection
          newPorts.set(isChildPortIdChanged ? newChildPortId : oldChildPortId, childPort)

          // Recursively update grand-children
          recursivelyUpdateChildPorts(childPort, oldChildPortId, level + 1)
        })
      }

      recursivelyUpdateChildPorts(port, oldPortId)
    })

    node.setPorts(newPorts)
    return {
      node,
      portsIdsMapping,
    }
  }

  private static replacePortIdSchema(oldPortId: string): string {
    return oldPortId.replace(/:PO[\w-]{16}/g, '')
  }

  private static replacePortIdSchemaForSystemPort(oldPortId: string, portKey: string): string {
    // For system ports, use the key which should already have __ prefix
    // The key field contains __error, __execute, etc.
    if (portKey && portKey.startsWith('__')) {
      return portKey
    }

    return `__${portKey}`
  }
}
