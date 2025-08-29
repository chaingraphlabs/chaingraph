/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  IPortConfig,
} from '../port'
import type { INode } from './interface'
import {
  generatePortID,
} from '../port'
import { deepCopy } from '../utils'

export interface Context {
  nodeId: string
  parentPortConfig: IPortConfig | null
  propertyKey: string
  propertyValue: any
}

export class PortConfigProcessor {
  /**
   * Processes all port configurations of a node, ensuring they are fully specified.
   * @param node The node whose ports are to be processed.
   * @param portsConfig The port configurations to process.
   * @returns The processed port configurations.
   */
  processNodePorts(
    node: INode,
    portsConfig: Map<string, IPortConfig>,
  ): Map<string, IPortConfig> {
    const nodeId = node.id
    // const nodeMetadata = node.metadata

    if (portsConfig) {
      // Process each port configuration associated with the node
      for (const [propertyKey, portConfig] of portsConfig.entries()) {
        const processedPortConfig = this.processPortConfig(
          // { ...portConfig }, // Clone to avoid mutating original
          deepCopy(portConfig), // Clone to avoid mutating original
          {
            nodeId,
            parentPortConfig: null,
            propertyKey,
            propertyValue: (node as any)[propertyKey],
          },
        )

        // Update the port config in the node metadata
        portsConfig.set(propertyKey, processedPortConfig)
      }
    }

    // sort ports by order or if order is undefined or same, sort by key
    const sortedPortsConfig = new Map([
      ...Array.from(portsConfig.entries()).sort((a, b) => {
        const orderA = a[1].order ?? 0
        const orderB = b[1].order ?? 0
        if (orderA !== orderB) {
          return orderA - orderB
        }
        return a[0].localeCompare(b[0])
      }),
    ])

    return sortedPortsConfig
  }

  /**
   * Recursively processes a port configuration, returning a new object with all fields properly set.
   * @param portConfig The port configuration to process.
   * @param context The context for processing, including parent information.
   * @returns The processed port configuration.
   */
  public processPortConfig(
    portConfig: IPortConfig,
    context: Context,
  ): IPortConfig {
    // Assign basic fields and get a new portConfig
    portConfig = this.assignBasicFields(portConfig, context)

    return portConfig
  }

  /**
   * Assigns basic fields to the port configuration and returns a new port configuration.
   * @param portConfig The port configuration to assign basic fields to.
   * @param context The processing context.
   * @returns A new port configuration with basic fields assigned.
   */
  private assignBasicFields(
    portConfig: IPortConfig,
    context: Context,
  ): IPortConfig {
    const { nodeId, parentPortConfig, propertyKey, propertyValue } = context

    // Create a new object to avoid mutation
    const newPortConfig = { ...portConfig }

    newPortConfig.id = portConfig.id || generatePortID(propertyKey)

    // Assign key
    if (!newPortConfig.key) {
      newPortConfig.key = propertyKey ?? newPortConfig.title ?? newPortConfig.id
    }

    // Assign defaultValue

    // If the node field has an explicit value, override the defaultValue from the config.
    if (propertyValue !== undefined) {
      // Log warning if needed (optional)
      newPortConfig.defaultValue = deepCopy(propertyValue) ?? portConfig.defaultValue
    } else {
      newPortConfig.defaultValue = portConfig.defaultValue
    }

    // Assign parentId
    if (
      (!newPortConfig.parentId && parentPortConfig?.id)
      || (parentPortConfig?.id !== undefined && newPortConfig.parentId !== parentPortConfig.id)
    ) {
      newPortConfig.parentId = parentPortConfig.id
    }

    // Assign nodeId
    if (nodeId) {
      newPortConfig.nodeId = nodeId
    }

    // Assign direction
    if (!newPortConfig.direction && parentPortConfig?.direction !== undefined) {
      newPortConfig.direction = parentPortConfig.direction
    }

    return newPortConfig
  }
}
