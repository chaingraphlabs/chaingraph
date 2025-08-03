/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { AnyPort, StringPort } from '../../../../port'
import type { ActionContext } from '../../types'
import { describe, expect, it } from 'vitest'
import { FlowEventType, newEvent } from '../../../events'
import { Flow } from '../../../flow'
import { TypeAdaptationAction } from '../TypeAdaptationAction'
import {
  AnyNode,
  ArrayStringNode,
  BooleanNode,
  createConnectedNodes,
  createNode,
  NumberNode,
  ObjectNode,
  StringNode,
} from './test-utils'

describe('typeAdaptationAction', () => {
  it('should adapt AnyPort to string type', async () => {
    const flow = new Flow()
    const action = new TypeAdaptationAction()

    // Create and connect String -> Any
    const { sourceNode, targetNode, edge } = await createConnectedNodes(
      flow,
      StringNode,
      AnyNode,
      'out',
      'in',
    )

    // Set source value
    sourceNode.findPortByKey('out')!.setValue('Hello')

    // Create EdgeAdded event
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

    // Check and execute
    expect(action.canExecute(context)).toBe(true)
    action.execute(context)

    // Verify AnyPort adopted string type
    const targetPort = targetNode.findPortByKey('in')!
    expect(targetPort.getConfig().type).toBe('any')
    expect((targetPort as any).unwrapUnderlyingType()?.type).toBe('string')
    expect(targetPort.getValue()).toBe('Hello')
  })

  it('should adapt AnyPort to number type', async () => {
    const flow = new Flow()
    const action = new TypeAdaptationAction()

    const { sourceNode, targetNode, edge } = await createConnectedNodes(
      flow,
      NumberNode,
      AnyNode,
      'out',
      'in',
    )

    sourceNode.findPortByKey('out')!.setValue(42)

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

    const targetPort = targetNode.findPortByKey('in')!
    expect((targetPort as any).unwrapUnderlyingType()?.type).toBe('number')
    expect(targetPort.getValue()).toBe(42)
  })

  it('should adapt AnyPort to boolean type', async () => {
    const flow = new Flow()
    const action = new TypeAdaptationAction()

    const { sourceNode, targetNode, edge } = await createConnectedNodes(
      flow,
      BooleanNode,
      AnyNode,
      'out',
      'in',
    )

    sourceNode.findPortByKey('out')!.setValue(true)

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

    const targetPort = targetNode.findPortByKey('in')!
    expect((targetPort as any).unwrapUnderlyingType()?.type).toBe('boolean')
    expect(targetPort.getValue()).toBe(true)
  })

  it('should adapt AnyPort to object type', async () => {
    const flow = new Flow()
    const action = new TypeAdaptationAction()

    const { sourceNode, targetNode, edge } = await createConnectedNodes(
      flow,
      ObjectNode,
      AnyNode,
      'out',
      'in',
    )

    const testValue = { name: 'John', age: 30 }
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

    expect(action.canExecute(context)).toBe(true)
    action.execute(context)

    const targetPort = targetNode.findPortByKey('in')!
    const underlyingType = (targetPort as any).unwrapUnderlyingType()
    expect(underlyingType?.type).toBe('object')
    expect(underlyingType?.schema).toBeDefined()
    expect(targetPort.getValue()).toEqual(testValue)
  })

  it('should adapt AnyPort to array type', async () => {
    const flow = new Flow()
    const action = new TypeAdaptationAction()

    const { sourceNode, targetNode, edge } = await createConnectedNodes(
      flow,
      ArrayStringNode,
      AnyNode,
      'out',
      'in',
    )

    const testValue = ['hello', 'world']
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

    expect(action.canExecute(context)).toBe(true)
    action.execute(context)

    const targetPort = targetNode.findPortByKey('in')!
    const underlyingType = (targetPort as any).unwrapUnderlyingType()
    expect(underlyingType?.type).toBe('array')
    expect(underlyingType?.itemConfig?.type).toBe('string')
    expect(targetPort.getValue()).toEqual(testValue)
  })

  it('should handle EdgesAdded event with multiple edges', async () => {
    const flow = new Flow()
    const action = new TypeAdaptationAction()

    // Create multiple connections
    const { sourceNode: source1, targetNode: target1, edge: edge1 } = await createConnectedNodes(
      flow,
      StringNode,
      AnyNode,
      'out',
      'in',
      'source1',
      'target1',
    )

    const { sourceNode: source2, targetNode: target2, edge: edge2 } = await createConnectedNodes(
      flow,
      NumberNode,
      AnyNode,
      'out',
      'in',
      'source2',
      'target2',
    )

    source1.findPortByKey('out')!.setValue('Hello')
    source2.findPortByKey('out')!.setValue(123)

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

    expect(action.canExecute(context)).toBe(true)
    action.execute(context)

    // Verify both targets adapted correctly
    const targetPort1 = target1.findPortByKey('in')!
    const targetPort2 = target2.findPortByKey('in')!

    expect((targetPort1 as AnyPort).unwrapUnderlyingType()?.type).toBe('string')
    expect(targetPort1.getValue()).toBe('Hello')

    expect((targetPort2 as AnyPort).unwrapUnderlyingType()?.type).toBe('number')
    expect(targetPort2.getValue()).toBe(123)
  })

  it('should preserve target port metadata when adapting type', async () => {
    const flow = new Flow()
    const action = new TypeAdaptationAction()

    const { sourceNode, targetNode, edge } = await createConnectedNodes(
      flow,
      StringNode,
      AnyNode,
      'out',
      'in',
    )

    const targetPort = targetNode.findPortByKey('in')!
    const originalConfig = targetPort.getConfig()

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

    const updatedConfig = targetPort.getConfig()

    // Verify metadata preserved
    expect(updatedConfig.id).toBe(originalConfig.id)
    expect(updatedConfig.direction).toBe(originalConfig.direction)
    expect(updatedConfig.nodeId).toBe(originalConfig.nodeId)
    expect(updatedConfig.key).toBe(originalConfig.key)
    expect(updatedConfig.title).toBe(originalConfig.title)
  })

  it('should not execute for non-AnyPort targets', async () => {
    const flow = new Flow()
    const action = new TypeAdaptationAction()

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

    // Should return false for non-AnyPort
    expect(action.canExecute(context)).toBe(false)
  })

  it('should not execute for non-edge events', () => {
    const flow = new Flow()
    const action = new TypeAdaptationAction()

    const event = newEvent(
      1,
      flow.id,
      FlowEventType.PortUpdated,
      {
        port: {} as any,
        nodeVersion: 1,
      },
    )

    const context: ActionContext = { event, flow }

    expect(action.canExecute(context)).toBe(false)
  })

  it('should handle missing nodes gracefully', () => {
    const flow = new Flow()
    const action = new TypeAdaptationAction()

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

  it('should use default value when source value is undefined', async () => {
    const flow = new Flow()
    const action = new TypeAdaptationAction()

    const sourceNode = createNode(StringNode, 'source')
    const targetNode = createNode(AnyNode, 'target')

    // Set a default value on the source port
    const sourcePort = sourceNode.findPortByKey('out')! as StringPort
    sourcePort.setConfig({
      ...sourcePort.getConfig(),
      defaultValue: 'default-value',
    })

    flow.addNode(sourceNode)
    flow.addNode(targetNode)

    const edge = await flow.connectPorts(
      sourceNode.id,
      sourcePort.id,
      targetNode.id,
      targetNode.findPortByKey('in')!.id,
    )

    const event = newEvent(
      1,
      flow.id,
      FlowEventType.EdgeAdded,
      {
        edgeId: edge.id,
        sourceNodeId: sourceNode.id,
        sourcePortId: sourcePort.id,
        targetNodeId: targetNode.id,
        targetPortId: targetNode.findPortByKey('in')!.id,
        metadata: {},
      },
    )

    const context: ActionContext = { event, flow }
    action.execute(context)

    const targetPort = targetNode.findPortByKey('in')!
    const underlyingType = (targetPort as AnyPort).unwrapUnderlyingType()
    expect(underlyingType?.defaultValue).toBe('default-value')
  })
})
