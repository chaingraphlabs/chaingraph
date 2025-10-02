/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '../../node/interface'
import type { Connection, IPortConfig } from '../../port'
import type { JSONValue } from '../../utils/json'
import type { IFlow } from '../interface'

import { NodeRegistry } from '../../decorator/registry'
import { getSystemPortConfigs } from '../../node/default-ports'
import { PortConfigProcessor } from '../../node/port-config-processor'
import { PortFactory } from '../../port'
import { deepCopy } from '../../utils'

export interface SerializedPort {
  config: JSONValue | any // TODO: needs to be more specific
  value?: JSONValue | any
}

export interface SerializedSystemPorts {
  error: {
    id: string
    value?: boolean
  }
  errorMessage: {
    id: string
    value?: string
  }
  execute: {
    id: string
    value?: boolean
  }
  success: {
    id: string
    value?: boolean
  }
}

export interface SerializedNode {
  id: string
  type: string
  metadata?: Record<string, JSONValue>
  status: string
  systemPorts?: SerializedSystemPorts
  ports?: SerializedPort[]
  connections: Record<string, Connection[]>
  schemaVersion: string
}

export interface SerializedFlow {
  // Define the structure of the serialized flow here
  flowId: string
  name: string
  description?: string
  nodes: unknown[]
  edges: unknown[]
  ports: unknown[] // ?????
  metadata?: Record<string, JSONValue> // More specific metadata can be added as needed
  version?: string
}

export class FlowSerializer {
  constructor(
    // protected flow: IFlow,
  ) {
  }

  serializeNode(node: INode): SerializedNode {
    const serializedPorts: SerializedPort[] = []

    // To keep track of connections between ports
    // Key is the port id, value is an array of connected port ids
    const connections: Record<string, Connection[]> = {}

    // Serialize all ports
    for (const [portId, port] of node.ports.entries()) {
      const existingConnections = connections[portId] || []
      if ((port.getConfig().connections?.length || 0) > 0 || existingConnections.length > 0) {
        connections[portId] = [
          ...existingConnections,
          ...deepCopy(port.getConfig().connections),
        ]
      }

      if (port.isSystem() || port.getConfig().parentId) {
        // System and child ports are handled separately
        continue
      }

      // Serialize port configuration and value
      const serializedPortConfig = port.serializeConfig(port.getConfig())
      const serializedPort: SerializedPort = {
        config: serializedPortConfig,
      }
      if (port.getValue() !== undefined) {
        serializedPort.value = port.serializeValue(port.getValue())
      }

      serializedPorts.push(serializedPort)
    }

    // TODO: make a nodes registry to handle nodes metadata reference and avoid duplicating metadata
    // TODO: make a ports registry to handle ports config reference and avoid duplicating config
    // TODO: for example if two nodes have the same type, we could store the metadata once and reference it by id

    return {
      id: node.id,
      type: node.metadata.type,
      metadata: { ...node.metadata },
      status: node.status.toString(),
      systemPorts: this.serializeNodeSystemPorts(node),
      ports: serializedPorts,
      connections,
      schemaVersion: 'v2',
    }
  }

  protected serializeNodeSystemPorts(node: INode): SerializedSystemPorts {
    const errorPort = node.getErrorPort()
    const errorMessagePort = node.getErrorMessagePort()
    const flowInPort = node.getFlowInPort()
    const flowOutPort = node.getFlowOutPort()

    return {
      error: {
        id: errorPort?.id || '',
        value: errorPort?.getValue() as boolean | undefined,
      },
      errorMessage: {
        id: errorMessagePort?.id || '',
        value: errorMessagePort?.getValue() as string | undefined,
      },
      execute: {
        id: flowInPort?.id || '',
        value: flowInPort?.getValue() as boolean | undefined,
      },
      success: {
        id: flowOutPort?.id || '',
        value: flowOutPort?.getValue() as boolean | undefined,
      },
    }
  }

  deserializeNode<T extends INode = INode>(
    serializedNode: SerializedNode,
    instance?: T,
  ): T {
    const node = instance ?? NodeRegistry.getInstance().createNode(
      serializedNode.type,
      serializedNode.id,
      serializedNode.metadata,
    )

    const systemPorts = getSystemPortConfigs({
      portsConfig: {
        error: {
          id: serializedNode.systemPorts?.error.id || undefined,
          value: serializedNode.systemPorts?.error.value,
        },
        errorMessage: {
          id: serializedNode.systemPorts?.errorMessage.id || undefined,
          value: serializedNode.systemPorts?.errorMessage.value,
        },
        flowIn: {
          id: serializedNode.systemPorts?.execute.id || undefined,
          value: serializedNode.systemPorts?.execute.value,
        },
        flowOut: {
          id: serializedNode.systemPorts?.success.id || undefined,
          value: serializedNode.systemPorts?.success.value,
        },
      },
    })

    const portsConfig: Map<string, IPortConfig> = new Map()

    // add system ports config
    for (const portConfig of Object.values(systemPorts)) {
      portsConfig.set(portConfig.key || portConfig.id || '', portConfig)
    }

    const nodeAsAny = node as any

    // add serialized ports config
    for (const serializedPort of serializedNode.ports || []) {
      if (serializedPort.config?.parentId) {
        // Child ports are handled by their parent port
        continue
      }

      const portConfig = PortFactory.deserializeConfig(serializedPort.config)
      if (!portConfig || !portConfig.key) {
        console.warn('Failed to deserialize port config', serializedPort.config)
        continue
      }

      portsConfig.set(portConfig.key, portConfig)

      const field = portConfig.key

      if (serializedPort.value !== undefined) {
        nodeAsAny[field] = PortFactory.deserializeValue(portConfig, serializedPort.value)
      }
    }

    // set system ports values
    const processor = new PortConfigProcessor()
    const portsConfigProcessed = processor.processNodePorts(
      node,
      portsConfig,
    )
    //
    node.initializePortsFromConfigs(portsConfigProcessed || new Map())
    // node.initializePortsFromConfigs(portsConfig)

    // Update node properties from the actual port values
    for (const serializedPort of serializedNode.ports || []) {
      if (serializedPort.config?.parentId) {
        // Child ports are handled by their parent port
        continue
      }

      const port = node.getPort(serializedPort.config.id)
      if (!port) {
        continue
      }

      if (serializedPort.value !== undefined && serializedPort.config.key) {
        nodeAsAny[serializedPort.config.key] = PortFactory.deserializeValue(
          port.getConfig(),
          serializedPort.value,
        )
      }
    }

    const sortedNodePorts = new Map([...node.ports.entries()]
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
    node.setPorts(sortedNodePorts)

    node.setStatus(serializedNode.status as any, false) // avoid triggering status change event during deserialization
    node.setVersion(typeof serializedNode.metadata?.version === 'number' ? serializedNode.metadata?.version ?? 1 : 1)
    node.setMetadata(deepCopy(serializedNode.metadata) || {})

    // Set system ports values
    node.getFlowInPort()?.setValue(serializedNode.systemPorts?.execute.value)
    node.getFlowOutPort()?.setValue(serializedNode.systemPorts?.success.value)
    node.getErrorPort()?.setValue(serializedNode.systemPorts?.error.value)
    node.getErrorMessagePort()?.setValue(serializedNode.systemPorts?.errorMessage.value)

    node.bindPortBindings()

    // attach connections to the ports
    if (serializedNode.connections) {
      for (const [portId, conns] of Object.entries(serializedNode.connections)) {
        let port = node.ports.get(portId)
        if (!port) {
          // console.warn(`Port with id ${portId} not found on node ${node.id} for connections`)
          if (portId === 'success' || portId === 'execute' || portId === 'error' || portId === 'errorMessage') {
            port = node.ports.get(`__${portId}`)
            if (!port) {
              throw new Error(`System port with id ${portId} not found on node ${node.id} for connections`)
            }
          }

          throw new Error(`Port with id ${portId} not found on node ${node.id} for connections`)
        }
        port.setConfig({
          ...port.getConfig(),
          connections: conns,
        })
      }
    }

    return node as T
  }

  serializeFlow(): JSONValue {
    return {}
  }

  deserializeFlow(serializedFlow: JSONValue): IFlow {
    throw new Error('Method not implemented.')
  }
}
