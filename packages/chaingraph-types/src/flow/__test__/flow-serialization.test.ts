/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext } from '../../execution'
import type { NodeExecutionResult } from '../../node'
import superjson from 'superjson'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Id, Input, Node, NodeRegistry, Number, Output, String } from '../../decorator'
import { BaseNode, findPort, registerNodeTransformers } from '../../node'
import {
  ArrayPortPlugin,
  EnumPortPlugin,
  NumberPortPlugin,
  ObjectPortPlugin,
  PortPluginRegistry,
  StreamPortPlugin,
  StringPortPlugin,
} from '../../port'
import { Flow } from '../flow'
import { registerFlowTransformers } from '../json-transformers'

PortPluginRegistry.getInstance().register(StringPortPlugin)
PortPluginRegistry.getInstance().register(NumberPortPlugin)
PortPluginRegistry.getInstance().register(ArrayPortPlugin)
PortPluginRegistry.getInstance().register(ObjectPortPlugin)
PortPluginRegistry.getInstance().register(EnumPortPlugin)
PortPluginRegistry.getInstance().register(StreamPortPlugin)

// Simple test nodes
@Node({
  title: 'Source Node',
})
class SourceNode extends BaseNode {
  @Input()
  @String()
  @Id('input')
  input: string = 'test'

  @Output()
  @String()
  @Id('output')
  output: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    this.output = this.input
    return {}
  }
}

@Node({
  title: 'Target Node',
})
class TargetNode extends BaseNode {
  @Input()
  @String()
  @Id('textInput')
  textInput: string = ''

  @Input()
  @String()
  @Id('textInput2')
  textInput2: string = ''

  @Input()
  @Number()
  @Id('numberInput')
  numberInput: number = 0

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {}
  }
}

describe('flow Serialization', () => {
  beforeAll(() => {
    // Register all necessary transformers
    // registerPortTransformers()
    registerNodeTransformers()
    registerFlowTransformers()
  })

  afterAll(() => {
    NodeRegistry.getInstance().clear()
  })

  it('should correctly serialize and deserialize a simple flow', async () => {
    // Create a flow
    const flow = new Flow({
      name: 'Test Flow',
      description: 'A test flow for serialization',
    })

    // Create nodes
    const sourceNode = new SourceNode('source-1')
    const targetNode = new TargetNode('target-1')

    // Initialize nodes
    sourceNode.initialize()
    targetNode.initialize()

    // Add nodes to flow
    flow.addNode(sourceNode)
    flow.addNode(targetNode)

    const sourcePort = findPort(
      sourceNode,
      port => port.getConfig().key === 'output',
    )
    const targetPort = findPort(
      targetNode,
      port => port.getConfig().key === 'textInput',
    )

    expect(sourcePort).toBeDefined()
    expect(targetPort).toBeDefined()

    // Set initial values
    sourceNode.input = 'Hello, World!'

    // Connect nodes
    await flow.connectPorts(
      sourceNode.id,
      sourcePort?.id ?? '',
      targetNode.id,
      targetPort?.id ?? '',
    )

    await flow.validate()

    // Serialize the flow
    const serialized = superjson.serialize(flow)

    // Deserialize the flow
    const deserialized = superjson.deserialize<Flow>(serialized)

    await deserialized.validate()

    // Verify deserialized flow
    expect(deserialized).toBeDefined()
    expect(deserialized instanceof Flow).toBe(true)
    expect(deserialized.id).toBe(flow.id)
    expect(deserialized.metadata.name).toBe(flow.metadata.name)
    expect(deserialized.metadata.description).toBe(flow.metadata.description)

    // Verify nodes
    expect(deserialized.nodes.size).toBe(2)
    const deserializedSourceNode = deserialized.nodes.get('source-1')
    const deserializedTargetNode = deserialized.nodes.get('target-1')

    expect(deserializedSourceNode).toBeDefined()
    expect(deserializedSourceNode?.metadata).toEqual(sourceNode.metadata)
    expect(deserializedTargetNode).toBeDefined()
    expect(deserializedTargetNode?.metadata).toEqual(targetNode.metadata)

    // Verify ports
    expect(deserializedSourceNode?.getPort('output')).toBeDefined()
    expect(deserializedTargetNode?.getPort('textInput')).toBeDefined()
    expect(deserializedTargetNode?.getPort('numberInput')).toBeDefined()

    // Verify edges
    expect(deserialized.edges.size).toBe(1)
    const edge = Array.from(deserialized.edges.values())[0]
    expect(edge.sourceNode.id).toBe(sourceNode.id)
    expect(edge.targetNode.id).toBe(targetNode.id)
    expect(edge.sourcePort.id).toBe('output')
    expect(edge.targetPort.id).toBe('textInput')
  })

  it('should handle flow with multiple connected nodes', async () => {
    const flow = new Flow({
      name: 'Multi-Node Flow',
      description: 'Flow with multiple nodes',
    })

    // Create multiple source and target nodes
    const source1 = new SourceNode('source-1')
    const source2 = new SourceNode('source-2')
    const target1 = new TargetNode('target-1')
    const target2 = new TargetNode('target-2')

    // Initialize all nodes
    source1.initialize()
    source2.initialize()
    target1.initialize()
    target2.initialize()

    // Add nodes to flow
    flow.addNode(source1)
    flow.addNode(source2)
    flow.addNode(target1)
    flow.addNode(target2)

    // Set initial values
    source1.input = 'Input 1'
    source2.input = 'Input 2'

    // Create multiple connections
    await flow.connectPorts(source1.id, 'output', target1.id, 'textInput')
    await flow.connectPorts(source1.id, 'output', target2.id, 'textInput')
    await flow.connectPorts(source2.id, 'output', target2.id, 'textInput2')

    // Serialize
    const serialized = superjson.serialize(flow)
    await flow.validate()

    // Deserialize
    const deserialized = superjson.deserialize<Flow>(serialized)
    await deserialized.validate()

    // Verify structure
    expect(deserialized.nodes.size).toBe(4)
    expect(deserialized.edges.size).toBe(3)

    // Verify all nodes exist
    const deserializedNodeSource1 = deserialized.nodes.get('source-1')
    expect(deserializedNodeSource1).toBeDefined()
    expect(deserializedNodeSource1 instanceof SourceNode).toBe(true)
    expect(deserializedNodeSource1?.metadata).toEqual(source1.metadata)

    const deserializedNodeSource2 = deserialized.nodes.get('source-2')
    expect(deserializedNodeSource2).toBeDefined()
    expect(deserializedNodeSource2 instanceof SourceNode).toBe(true)
    expect(deserializedNodeSource2?.metadata).toEqual(source2?.metadata)

    const deserializedNodeTarget1 = deserialized.nodes.get('target-1')
    expect(deserializedNodeTarget1).toBeDefined()
    expect(deserializedNodeTarget1 instanceof TargetNode).toBe(true)
    expect(deserializedNodeTarget1?.metadata).toEqual(target1?.metadata)

    const deserializedNodeTarget2 = deserialized.nodes.get('target-2')
    expect(deserializedNodeTarget2).toBeDefined()
    expect(deserializedNodeTarget2 instanceof TargetNode).toBe(true)
    expect(deserializedNodeTarget2?.metadata).toEqual(target2?.metadata)

    // Verify connections
    const edges = Array.from(deserialized.edges.values())
    expect(edges.some(e =>
      e.sourceNode.id === 'source-1'
      && e.targetNode.id === 'target-1'
      && e.sourcePort.id === 'output'
      && e.targetPort.id === 'textInput',
    )).toBe(true)

    expect(edges.some(e =>
      e.sourceNode.id === 'source-1'
      && e.targetNode.id === 'target-2'
      && e.sourcePort.id === 'output'
      && e.targetPort.id === 'textInput',
    )).toBe(true)

    expect(edges.some(e =>
      e.sourceNode.id === 'source-2'
      && e.targetNode.id === 'target-2'
      && e.sourcePort.id === 'output'
      && e.targetPort.id === 'textInput2',
    )).toBe(true)
  })

  it('should preserve node values after serialization/deserialization', async () => {
    const flow = new Flow({ name: 'Value Test Flow' })

    // Create and initialize nodes
    const source = new SourceNode('source')
    source.initialize()
    flow.addNode(source)

    // Set specific values
    source.input = 'Test Value'

    // Serialize and deserialize
    const serialized = superjson.serialize(flow)
    const deserialized = superjson.deserialize<Flow>(serialized)

    // Get the deserialized node
    const deserializedSource = deserialized.nodes.get('source') as SourceNode

    // Verify values are preserved
    expect(deserializedSource.input).toBe('Test Value')
  })

  it('should handle empty flow serialization', async () => {
    const flow = new Flow({
      name: 'Empty Flow',
      description: 'Flow with no nodes or edges',
    })

    const serialized = superjson.serialize(flow)
    const deserialized = superjson.deserialize<Flow>(serialized)

    expect(deserialized.nodes.size).toBe(0)
    expect(deserialized.edges.size).toBe(0)
    expect(deserialized.metadata.name).toBe('Empty Flow')
    expect(deserialized.metadata.description).toBe('Flow with no nodes or edges')
  })
})
