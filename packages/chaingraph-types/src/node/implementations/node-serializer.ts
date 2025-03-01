/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeStatus } from '../../node/node-enums'
import type { NodeMetadata } from '../../node/types'
import type { IPort } from '../../port'
import type { JSONValue } from '../../utils/json'
import type { INodeComposite, IPortBinder, IPortManager, ISerializable } from '../interfaces'
import { PortFactory } from '../../port'
import { SerializedNodeSchema } from '../types.zod'

/**
 * Implementation of ISerializable interface
 * Handles serialization and deserialization of nodes
 */
export class NodeSerializer implements ISerializable<INodeComposite> {
  constructor(
    private id: string,
    private metadata: NodeMetadata,
    private status: NodeStatus,
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
    const serializedPorts: Record<string, JSONValue> = {}

    // Serialize all ports
    for (const [portId, port] of this.portManager.ports.entries()) {
      serializedPorts[portId] = port.serialize()
    }

    return {
      id: this.id,
      metadata: { ...this.metadata },
      status: this.status,
      ports: serializedPorts,
    }
  }

  /**
   * Deserialize from JSON data
   * @param data The serialized data
   * @returns The deserialized instance
   */
  deserialize(data: JSONValue): INodeComposite {
    // Validate incoming data using the Zod schema
    const obj = SerializedNodeSchema.parse(data)

    // Update status (id is immutable)
    this.status = obj.status

    // Update metadata
    Object.assign(this.metadata, obj.metadata || {})

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

    // Update port manager with all ports
    this.portManager.setPorts(nodePorts)

    // Critical: ensure all ports are properly bound to node properties
    if (this.portBinder) {
      this.portBinder.rebindAfterDeserialization()
    }

    return this.nodeRef || this.createInstance(this.id)
  }

  /**
   * Create a deep clone of the node
   * @returns A new node instance with the same state
   */
  clone(): INodeComposite {
    const serialized = this.serialize()
    const node = this.createInstance(this.id)
    node.deserialize(serialized)
    return node
  }
}
