/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPort, ObjectPort, ObjectPortConfig } from '../../../../port'
import type { ActionContext } from '../../types'
import { describe, expect, it } from 'vitest'
import { Edge } from '../../../..//edge'
import { FlowEventType, newEvent } from '../../../events'
import { Flow } from '../../../flow'
import { SchemaTransferAction } from '../SchemaTransferAction'
import {
  AnyNode,
  createConnectedNodes,
  createNode,
  MutableObjectNode,
  ObjectNode,
  StringNode,
} from './test-utils'

describe('schemaTransferAction', () => {
  it('should transfer schema on edge creation for mutable object ports', async () => {
    const flow = new Flow()
    const action = new SchemaTransferAction()

    const { sourceNode, targetNode, edge } = await createConnectedNodes(
      flow,
      ObjectNode,
      MutableObjectNode,
      'out',
      'in',
    )

    const event = newEvent(
      1,
      flow.id,
      FlowEventType.EdgeAdded,
      {
        edgeId: edge.id,
        sourceNodeId: sourceNode.id,
        sourcePortId: sourceNode.findPortByKey('out')!.id,
        targetNodeId: targetNode.id,
        targetPortId: targetNode.findPortByKey('in')!.id,
        metadata: {},
      },
    )

    const context: ActionContext = { event, flow }

    expect(action.canExecute(context)).toBe(true)
    action.execute(context)

    // Verify schema was transferred
    const targetPort = targetNode.findPortByKey('in')!
    const targetConfig = targetPort.getConfig() as ObjectPortConfig

    expect(targetConfig.type).toBe('object')
    expect(targetConfig.schema.properties).toBeDefined()
    expect(Object.keys(targetConfig.schema.properties || {})).toContain('name')
    expect(Object.keys(targetConfig.schema.properties || {})).toContain('age')
  })

  it('should transfer schema on port update', async () => {
    const flow = new Flow()
    const action = new SchemaTransferAction()

    const { sourceNode, targetNode } = await createConnectedNodes(
      flow,
      ObjectNode,
      MutableObjectNode,
      'out',
      'in',
    )

    const sourcePort = sourceNode.findPortByKey('out')!
    sourcePort.setValue({ name: 'Alice', age: 25 })

    const event = newEvent(
      1,
      flow.id,
      FlowEventType.PortUpdated,
      {
        port: sourcePort as IPort,
        nodeVersion: sourceNode.getVersion(),
      },
    )

    const context: ActionContext = { event, flow }

    expect(action.canExecute(context)).toBe(true)
    action.execute(context)

    // Verify schema and value were transferred
    const targetPort = targetNode.findPortByKey('in')!
    const targetConfig = targetPort.getConfig() as ObjectPortConfig

    expect(Object.keys(targetConfig.schema.properties || {})).toContain('name')
    expect(Object.keys(targetConfig.schema.properties || {})).toContain('age')
    expect(targetPort.getValue()).toEqual({ name: 'Alice', age: 25 })
  })

  it('should not transfer schema to immutable object ports', async () => {
    const flow = new Flow()
    const action = new SchemaTransferAction()

    // ObjectNode has immutable schema by default
    const { sourceNode, targetNode, edge } = await createConnectedNodes(
      flow,
      ObjectNode,
      MutableObjectNode,
      'out',
      'in',
    )

    const event = newEvent(
      1,
      flow.id,
      FlowEventType.EdgeAdded,
      {
        edgeId: edge.id,
        sourceNodeId: sourceNode.id,
        sourcePortId: sourceNode.findPortByKey('out')!.id,
        targetNodeId: targetNode.id,
        targetPortId: targetNode.findPortByKey('in')!.id,
        metadata: {},
      },
    )

    const context: ActionContext = { event, flow }

    // Get original schema
    const targetPort = targetNode.findPortByKey('in')! as ObjectPort
    const originalSchema = targetPort.getConfig().schema

    action.execute(context)

    // Schema should remain unchanged
    const newSchema = targetPort.getConfig().schema
    expect(newSchema).toEqual(originalSchema)
  })

  it('should not transfer schema if target already has properties', async () => {
    const flow = new Flow()
    const action = new SchemaTransferAction()

    // Create a mutable object node with existing schema
    const targetNode = createNode(MutableObjectNode, 'target')
    const targetPort = targetNode.findPortByKey('in')! as ObjectPort

    // Set existing schema properties
    targetPort.setConfig({
      ...targetPort.getConfig(),
      schema: {
        type: 'object',
        properties: {
          existingProp: { type: 'string' },
        },
      },
    })

    const sourceNode = createNode(ObjectNode, 'source')
    const sourcePort = sourceNode.findPortByKey('out')!

    flow.addNode(sourceNode)
    flow.addNode(targetNode)

    const edge = new Edge(
      'edge1',
      sourceNode,
      sourcePort,
      targetNode,
      targetPort as IPort,
    )

    const event = newEvent(
      1,
      flow.id,
      FlowEventType.EdgeAdded,
      {
        edgeId: edge.id,
        sourceNodeId: sourceNode.id,
        sourcePortId: sourceNode.findPortByKey('out')!.id,
        targetNodeId: targetNode.id,
        targetPortId: targetPort.id,
        metadata: {},
      },
    )

    const context: ActionContext = { event, flow }
    action.execute(context)

    // Schema should remain unchanged
    const finalSchema = targetPort.getConfig().schema
    expect(Object.keys(finalSchema.properties || {})).toContain('existingProp')
    expect(Object.keys(finalSchema.properties || {})).not.toContain('name')
    expect(Object.keys(finalSchema.properties || {})).not.toContain('age')
  })

  it('should handle AnyPort with object underlying type', async () => {
    const flow = new Flow()
    const action = new SchemaTransferAction()

    // First connect ObjectNode to AnyNode to set underlying type
    const { sourceNode: objectNode, targetNode: anyNode } = await createConnectedNodes(
      flow,
      ObjectNode,
      AnyNode,
      'out',
      'in',
    )

    // Now connect AnyNode to MutableObjectNode
    const mutableNode = createNode(MutableObjectNode, 'mutable')
    flow.addNode(mutableNode)

    const edge = await flow.connectPorts(
      anyNode.id,
      anyNode.findPortByKey('out')!.id,
      mutableNode.id,
      mutableNode.findPortByKey('in')!.id,
    )

    // Update the any port to trigger schema transfer
    const anyPort = anyNode.findPortByKey('out')!
    anyPort.setValue({ name: 'Test', age: 30 })

    const event = newEvent(
      1,
      flow.id,
      FlowEventType.PortUpdated,
      {
        port: anyPort as IPort,
        nodeVersion: anyNode.getVersion(),
      },
    )

    const context: ActionContext = { event, flow }

    expect(action.canExecute(context)).toBe(true)
    action.execute(context)

    // Verify schema was transferred through AnyPort
    const targetPort = mutableNode.findPortByKey('in')!
    expect(targetPort.getValue()).toEqual({ name: 'Test', age: 30 })
  })

  it('should handle EdgesAdded event with multiple edges', async () => {
    const flow = new Flow()
    const action = new SchemaTransferAction()

    // Create multiple connections
    const { sourceNode: source1, targetNode: target1, edge: edge1 } = await createConnectedNodes(
      flow,
      ObjectNode,
      MutableObjectNode,
      'out',
      'in',
      'source1',
      'target1',
    )

    const { sourceNode: source2, targetNode: target2, edge: edge2 } = await createConnectedNodes(
      flow,
      ObjectNode,
      MutableObjectNode,
      'out',
      'in',
      'source2',
      'target2',
    )

    const event = newEvent(
      1,
      flow.id,
      FlowEventType.EdgesAdded,
      {
        edges: [
          {
            edgeId: edge1.id,
            sourceNodeId: source1.id,
            sourcePortId: source1.findPortByKey('out')!.id,
            targetNodeId: target1.id,
            targetPortId: target1.findPortByKey('in')!.id,
            metadata: {},
          },
          {
            edgeId: edge2.id,
            sourceNodeId: source2.id,
            sourcePortId: source2.findPortByKey('out')!.id,
            targetNodeId: target2.id,
            targetPortId: target2.findPortByKey('in')!.id,
            metadata: {},
          },
        ],
      },
    )

    const context: ActionContext = { event, flow }
    action.execute(context)

    // Verify both targets received schema
    const targetPort1 = target1.findPortByKey('in')! as ObjectPort
    const targetPort2 = target2.findPortByKey('in')! as ObjectPort

    expect(Object.keys(targetPort1.getConfig().schema.properties || {})).toContain('name')
    expect(Object.keys(targetPort1.getConfig().schema.properties || {})).toContain('age')
    expect(Object.keys(targetPort2.getConfig().schema.properties || {})).toContain('name')
    expect(Object.keys(targetPort2.getConfig().schema.properties || {})).toContain('age')
  })

  it('should not execute for non-object ports', async () => {
    const flow = new Flow()
    const action = new SchemaTransferAction()

    const { sourceNode, targetNode, edge } = await createConnectedNodes(
      flow,
      StringNode,
      StringNode,
      'out',
      'in',
    )

    const event = newEvent(
      1,
      flow.id,
      FlowEventType.EdgeAdded,
      {
        edgeId: edge.id,
        sourceNodeId: sourceNode.id,
        sourcePortId: sourceNode.findPortByKey('out')!.id,
        targetNodeId: targetNode.id,
        targetPortId: targetNode.findPortByKey('in')!.id,
        metadata: {},
      },
    )

    const context: ActionContext = { event, flow }

    // Should execute but not do anything for non-object ports
    expect(action.canExecute(context)).toBe(true)
    action.execute(context)

    // No changes should occur
    const targetPort = targetNode.findPortByKey('in')!
    expect(targetPort.getConfig().type).toBe('string')
  })

  it('should not execute for non-supported events', () => {
    const flow = new Flow()
    const action = new SchemaTransferAction()

    const event = newEvent(
      1,
      flow.id,
      FlowEventType.NodeAdded,
      {
        node: {} as any,
      },
    )

    const context: ActionContext = { event, flow }

    expect(action.canExecute(context)).toBe(false)
  })

  it('should transfer initial value along with schema', async () => {
    const flow = new Flow()
    const action = new SchemaTransferAction()

    const { sourceNode, targetNode, edge } = await createConnectedNodes(
      flow,
      ObjectNode,
      MutableObjectNode,
      'out',
      'in',
    )

    const testValue = { name: 'Bob', age: 35 }
    sourceNode.findPortByKey('out')!.setValue(testValue)

    const event = newEvent(
      1,
      flow.id,
      FlowEventType.EdgeAdded,
      {
        edgeId: edge.id,
        sourceNodeId: sourceNode.id,
        sourcePortId: sourceNode.findPortByKey('out')!.id,
        targetNodeId: targetNode.id,
        targetPortId: targetNode.findPortByKey('in')!.id,
        metadata: {},
      },
    )

    const context: ActionContext = { event, flow }
    action.execute(context)

    const targetPort = targetNode.findPortByKey('in')!
    expect(targetPort.getValue()).toEqual(testValue)
  })

  it('should handle missing nodes gracefully', () => {
    const flow = new Flow()
    const action = new SchemaTransferAction()

    const event = newEvent(
      1,
      flow.id,
      FlowEventType.EdgeAdded,
      {
        edgeId: 'edge1',
        sourceNodeId: 'missing-source',
        sourcePortId: 'port1',
        targetNodeId: 'missing-target',
        targetPortId: 'port2',
        metadata: {},
      },
    )

    const context: ActionContext = { event, flow }

    // Should not throw
    expect(() => action.execute(context)).not.toThrow()
  })
})
