/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import type {
  NodeEvent,
} from '../..'
import { PortPluginRegistry } from '@badaitech/chaingraph-types'
import { afterAll, beforeAll, describe, it } from 'vitest'
import {
  AnyPort,
  ArrayPortPlugin,
  BaseNode,
  createNumberValue,
  EnumPortPlugin,
  filterPorts,
  Flow,
  Input,
  Node,
  NodeEventType,
  NodeRegistry,
  NumberPortPlugin,
  ObjectPortPlugin,
  Output,
  Number as PortNumber,
  PortObject,
  StreamPortPlugin,
  StringPortPlugin,
} from '../..'

PortPluginRegistry.getInstance().register(StringPortPlugin)
PortPluginRegistry.getInstance().register(NumberPortPlugin)
PortPluginRegistry.getInstance().register(ArrayPortPlugin)
PortPluginRegistry.getInstance().register(ObjectPortPlugin)
PortPluginRegistry.getInstance().register(EnumPortPlugin)
PortPluginRegistry.getInstance().register(StreamPortPlugin)

@Node({
  title: 'Scalar Node',
  description: 'Node with scalar ports',
})
class ScalarNode extends BaseNode {
  @Output()
  @PortNumber({
    title: 'Number Output',
    description: 'Output number',
    defaultValue: createNumberValue(0),
  })
  numberOutput: number = 0

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {}
  }
}

@Node({
  title: 'TestGate',
  description: 'TestGate with any ports',
})
class TestGateNode extends BaseNode {
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

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {}
  }

  async onEvent(event: NodeEvent): Promise<void> {
    await super.onEvent(event)

    if (event.type === NodeEventType.PortConnected) {
      // TODO: add check that show source port any has underlying type
    }
    if (event.type === NodeEventType.PortDisconnected) {
    }
  }
}

describe('gate node serialization', () => {
  beforeAll(() => {
    // Register ports from the new system
    // registerAllPorts()
  })

  afterAll(() => {
    NodeRegistry.getInstance().clear()
  })

  it('serializes and deserializes a node with any ports', async () => {
    const scalarNode = new ScalarNode('scalar-node')
    const gateNode = new TestGateNode('gate-node')

    scalarNode.initialize()
    gateNode.initialize()

    const flow = new Flow({ name: 'Gate Test Flow' })

    flow.addNode(scalarNode)
    flow.addNode(gateNode)

    // get gate input object port
    const gateInputObjectPort = gateNode.findPortByKey('inputObject')!
    const gateOutputObjectPort = gateNode.findPortByKey('outputObject')!

    // create new gate input any port
    const gateInputAnyPort1 = new AnyPort({
      id: 'gate-input-1',
      type: 'any',
      key: 'gate_input_1',
      parentId: gateInputObjectPort.id,
      nodeId: gateNode.id,
      order: 1,
      direction: 'input',
      connections: [],
    })

    gateNode.addObjectProperty(
      gateInputObjectPort,
      gateInputAnyPort1.key,
      gateInputAnyPort1.getConfig(),
    )
    flow.updateNode(gateNode)

    // connect scalar node output to gate input
    const scalarOutputPort = scalarNode.findPortByKey('numberOutput')!
    const gateInputPort = gateNode.findPortByKey('gate_input_1')!

    const edge = await flow.connectPorts(
      scalarNode.id,
      scalarOutputPort.id,
      gateNode.id,
      gateInputPort.id,
    )

    // disconnect the edge
    flow.removeEdge(
      edge.id,
    )

    const ports = filterPorts(gateNode, port => !port.isSystem())
    const portsSerialized = ports.map(port => port.serialize())

    // TODO: add asserts. Now it check only for exeptions
  })
})
