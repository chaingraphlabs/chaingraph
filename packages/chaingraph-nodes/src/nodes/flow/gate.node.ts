/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionContext,
  NodeEvent,
  NodeExecutionResult,
  PortConnectedEvent,
  PortDisconnectedEvent,
} from '@badaitech/chaingraph-types'
import {
  AnyPort,
} from '@badaitech/chaingraph-types'
import {
  filterPorts,
} from '@badaitech/chaingraph-types'

import {
  NodeEventType,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  Output,
  PortObject,
  String,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

/**
 * Gate Node - Creates dynamic port structure mappings between different parts of a flow
 *
 * Instead of creating predefined input/output pairs, this node:
 * 1. Starts with 'any' type input ports
 * 2. When connected to another port, inherits that port's type
 * 3. Creates matching output ports with the same keys as connected ports
 * 4. Forwards data from input to corresponding output during execution
 */
@Node({
  type: 'GateNode',
  title: 'Gate',
  description: 'Collects inputs and routes them to matching outputs, acting as a connection hub between different parts of the flow',
  category: NODE_CATEGORIES.FLOW,
  tags: ['flow', 'connect', 'route', 'hub', 'junction'],
})
class GateNode extends BaseNode {
  // Input object port containing dynamic input properties
  @Input()
  @PortObject({
    title: 'Gate Inputs',
    description: 'Connect inputs to properties of this object',
    isSchemaMutable: true,
    schema: {
      type: 'object',
      properties: {},
    },
    ui: {
      collapsed: false,
    },
  })
  inputObject: Record<string, any> = { }

  // Output object port containing matching output properties
  @Output()
  @PortObject({
    title: 'Gate Outputs',
    description: 'Connect these outputs to other nodes',
    isSchemaMutable: true,
    schema: {
      type: 'object',
      properties: {},
    },
    ui: {
      collapsed: false,
    },
  })
  outputObject: Record<string, any> = {}

  // Hidden port to store connections mapping
  @Input()
  @String({
    title: 'Connections Map',
    description: 'Internal storage for input-output port mappings',
    ui: {
      hidden: true,
    },
  })
  connectionsMap: string = '{}'

  // Get the connection map from the string
  private get connections(): Record<string, string> {
    try {
      return JSON.parse(this.connectionsMap)
    } catch (e) {
      console.error(`[GateNode ${this.id}] Error parsing connections map:`, e)
      return {}
    }
  }

  // Save the connection map to the string
  private saveConnections(connections: Record<string, string>): void {
    try {
      this.connectionsMap = JSON.stringify(connections)
    } catch (e) {
      console.error(`[GateNode ${this.id}] Error serializing connections:`, e)
    }
  }

  /**
   * Execute method handles transferring data from inputs to their corresponding outputs
   */
  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    console.log(`[GateNode ${this.id}] Executing with ${Object.keys(this.connections).length} connections`)

    // Transfer values from input properties to corresponding output properties
    for (const [inputKey, outputKey] of Object.entries(this.connections)) {
      try {
        // Get the value from input and set it to the output
        this.outputObject[outputKey] = this.inputObject[inputKey]
      } catch (error) {
        console.error(`[GateNode ${this.id}] Error transferring value from ${inputKey} to ${outputKey}:`, error)
      }
    }

    return {}
  }

  /**
   * Handles node events - primarily connection and disconnection events
   */
  async onEvent(event: NodeEvent): Promise<void> {
    // Call parent handler first
    await super.onEvent(event)

    // Handle port connection events
    if (event.type === NodeEventType.PortConnected) {
      await this.handlePortConnected(event as PortConnectedEvent)
    } else if (event.type === NodeEventType.PortDisconnected) {
      // Handle port disconnection events
      await this.handlePortDisconnected(event as PortDisconnectedEvent)
    }

    await this.ensureHasOneNotConnectedInputAnyPort()
  }

  /**
   * Handles port connection events
   * Sets underlying type and creates matching output ports
   */
  private async handlePortConnected(event: PortConnectedEvent): Promise<void> {

    // const gateInputsPorts = this.findPortByKey('inputObject')
    // if (!gateInputsPorts) {
    //   console.error(`[GateNode ${this.id}] Input ports not found for connection event`)
    //   return
    // }
    //
    // const gateOutputsPorts = this.findPortByKey('outputObject')
    // if (!gateOutputsPorts) {
    //   console.error(`[GateNode ${this.id}] Output ports not found for connection event`)
    //   return
    // }
    //
    // const gateInputPort = findPort(this, (port) => {
    //   return event.sourcePort.id === port.id
    // })
    // if (!gateInputPort) {
    //   console.error(`[GateNode ${this.id}] Input port not found for connection event`)
    //   return
    // }
    // const gateInputPortConfig = gateInputPort.getConfig()
    //
    // const connectedToPort = event.targetPort
    // const connectedToPortConfig = connectedToPort.getConfig()
    //
    // // Set the underlying type of the input port to match the connected port
    // if (gateInputPort instanceof AnyPort) {
    //   gateInputPort.setUnderlyingType({
    //     ...connectedToPortConfig,
    //     id: gateInputPort.id,
    //     direction: gateInputPortConfig.direction,
    //     nodeId: this.id,
    //     parentId: gateInputPortConfig.parentId,
    //     connections: gateInputPortConfig.connections,
    //     order: gateInputPortConfig.order,
    //   })
    //
    //   console.log(`[GateNode ${this.id}] UNDERLYING TYPE SET: `, gateInputPort.getConfig().underlyingType)
    //
    //   await this.updatePort(gateInputPort)
    // }
    //
    // await this.updatePort(gateInputsPorts)
    // await this.updatePort(gateOutputsPorts)
  }

  /**
   * Handles port disconnection events
   * Cleans up ports and connection mappings
   */
  private async handlePortDisconnected(event: PortDisconnectedEvent): Promise<void> {

  }

  private async ensureHasOneNotConnectedInputAnyPort(): Promise<void> {
    const gateInputObjectPort = this.findPortByKey('inputObject')
    if (!gateInputObjectPort) {
      console.error(`[GateNode ${this.id}] Input ports not found for connection event`)
      return
    }

    const allParentsGateInput = filterPorts(this, (port) => {
      const config = port.getConfig()
      return config.parentId === gateInputObjectPort.id
    })

    const emptyAnyPorts = filterPorts(this, (port) => {
      const config = port.getConfig()
      return config.parentId === gateInputObjectPort.id && config.type === 'any' && config.connections?.length === 0
    }).sort((a, b) => {
      const aOrder = a.getConfig().order ?? 100
      const bOrder = b.getConfig().order ?? 100
      return aOrder - bOrder
    })

    if (emptyAnyPorts.length === 0) {
      // needs to create a new one
      const gateInputAnyPort1 = new AnyPort({
        id: 'gate-input-1',
        type: 'any',
        key: 'gate_input_1',
        parentId: gateInputObjectPort.id,
        nodeId: this.id,
        order: allParentsGateInput.length + 1,
        direction: 'input',
        connections: [],
      })

      this.addObjectProperty(
        gateInputObjectPort,
        gateInputAnyPort1.key,
        gateInputAnyPort1.getConfig(),
      )
      await this.updatePort(gateInputObjectPort)
    } else if (emptyAnyPorts.length > 1) {
      // needs to remove all but one
      const portsToRemove = emptyAnyPorts.slice(1)
      for (const port of portsToRemove) {
        this.removeObjectProperty(gateInputObjectPort, port.getConfig().key || '')
      }
      await this.updatePort(gateInputObjectPort)
    }
  }
}

export default GateNode
