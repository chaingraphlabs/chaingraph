/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPort } from '../../port'
import type { JSONValue } from '../../utils/json'
import type { INodeComposite, IPortBinder, IPortManager, ISerializable } from '../interfaces'
import { PortFactory } from '../../port'
import { deepCopy } from '../../utils'
import { SerializedNodeSchema } from '../types.zod'

/**
 * Implementation of ISerializable interface
 * Handles serialization and deserialization of nodes
 */
export class NodeSerializer implements ISerializable<INodeComposite> {
  constructor(
    private portManager: IPortManager,
    private createInstance: (id: string) => INodeComposite,
    private portBinder?: IPortBinder,
    private nodeRef?: INodeComposite,
  ) { }

  /**
   * Serialize the node to a JSON-compatible format
   * @returns The serialized node
   */
  serialize(): JSONValue {
    if (!this.nodeRef) {
      throw new Error('Node reference is required for serialization')
    }

    const serializedPorts: Record<string, JSONValue> = {}

    // Serialize all ports
    for (const [portId, port] of this.portManager.ports.entries()) {
      serializedPorts[portId] = port.serialize()
    }

    return {
      id: this.nodeRef.id,
      metadata: { ...this.nodeRef.metadata },
      status: this.nodeRef.status.toString(),
      ports: serializedPorts,
    }
  }

  /**
   * Deserialize from JSON data
   * @param data The serialized data
   * @returns The deserialized instance
   */
  deserialize(data: JSONValue): INodeComposite {
    if (!this.nodeRef) {
      throw new Error('Node reference is required for deserialization')
    }

    // Validate incoming data using the Zod schema
    const obj = SerializedNodeSchema.parse(data)

    // Update status (id is immutable)
    this.nodeRef.setStatus(obj.status, false)

    // Update metadata
    this.nodeRef.setMetadata(deepCopy(obj.metadata))
    // Object.assign(this.coreNode.metadata, obj.metadata || {})

    // Clear current ports
    this.portManager.setPorts(new Map())

    const ports = obj.ports as Record<string, any>

    // Recreate all ports
    const nodePorts = new Map<string, IPort>()
    for (const portId in ports) {
      const serializedPort = ports[portId]
      if (serializedPort === undefined || serializedPort === null || !('config' in serializedPort)) {
        continue
      }

      // Create the port (using type assertion to avoid type errors)
      const newPort = PortFactory.create(serializedPort.config) as IPort

      // Deserialize its state
      newPort.deserialize(serializedPort)

      // Add to ports map
      nodePorts.set(portId, newPort)
    }

    // Sort map by port order, or if order is undefined or same, sort by key
    const sortedNodePorts = new Map([...nodePorts.entries()]
      .sort(
        (a, b) => {
          const orderA = a[1].getConfig().order ?? 0
          const orderB = b[1].getConfig().order ?? 0
          if (orderA !== orderB) {
            return orderA - orderB
          }
          return a[0].localeCompare(b[0])
        },
      ))

    // Update port manager with all ports
    this.portManager.setPorts(sortedNodePorts)

    // Critical: ensure all ports are properly bound to node properties
    if (this.portBinder) {
      this.portBinder.rebindAfterDeserialization()
    }

    return this.nodeRef || this.createInstance(obj.id)
  }

  /**
   * Create a deep clone of the node
   * @returns A new node instance with the same state
   */
  clone(): INodeComposite {
    if (!this.nodeRef) {
      throw new Error('Node reference is required for cloning')
    }

    const serialized = this.serialize()
    const node = this.createInstance(this.nodeRef.id)
    node.deserialize(serialized)
    return node
  }
}
