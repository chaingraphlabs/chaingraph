/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext } from '../../../../execution'
import type { NodeExecutionResult } from '../../../../node'
import type { IPort } from '../../../../port'
import type { StringPort } from '../../../../port'
import type { ActionContext } from '../../types'
import { describe, expect, it } from 'vitest'
import { Input, Output, PortString } from '../../../../decorator'
import { BaseNode } from '../../../../node'
import { FlowEventType, newEvent } from '../../../events'
import { Flow } from '../../../flow'
import { ValuePropagationAction } from '../ValuePropagationAction'

class Node extends BaseNode {
  @Input()
  @PortString({
    title: 'Input Port',
  })
  in: string = ''

  @Output()
  @PortString({
    title: 'Output Port',
  })
  out: string = ''

  execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return Promise.resolve({})
  }
}

describe('valuePropagationAction', () => {
  it('should propagate value from source to target port', async () => {
    // Create a flow
    const flow = new Flow()

    // Create nodes
    const sourceNode = new Node('source', { type: 'test' })
    sourceNode.initialize()

    const targetNode = new Node('target', { type: 'test' })
    targetNode.initialize()

    const sourcePort = sourceNode.findPortByKey('out') as StringPort
    const targetPort = targetNode.findPortByKey('in') as StringPort

    // Add nodes to flow
    flow.addNode(sourceNode)
    flow.addNode(targetNode)

    // Connect ports
    await flow.connectPorts(sourceNode.id, sourcePort.id, targetNode.id, targetPort.id)

    // Set source port value
    sourcePort.setValue('Hello World')

    // Create port update event
    const event = newEvent<FlowEventType.PortUpdated>(
      1,
      flow.id,
      FlowEventType.PortUpdated,
      {
        port: sourcePort as IPort,
        nodeVersion: sourceNode.getVersion(),
      },
    )

    // Create action context
    const context: ActionContext = {
      event,
      flow,
    }

    // Create and execute action
    const action = new ValuePropagationAction()

    // Check if action can execute
    expect(action.canExecute(context)).toBe(true)

    // Execute action
    action.execute(context)

    // Verify target port received the value
    expect(targetPort.getValue()).toBe('Hello World')
  })

  it('should not execute if port has no outgoing edges', () => {
    const flow = new Flow()
    const node = new Node('node', { type: 'test' })
    node.initialize()

    const port = node.findPortByKey('in') as IPort

    flow.addNode(node)

    const event = newEvent<FlowEventType.PortUpdated>(
      1,
      flow.id,
      FlowEventType.PortUpdated,
      {
        port,
        nodeVersion: node.getVersion(),
      },
    )

    const context: ActionContext = {
      event,
      flow,
    }

    const action = new ValuePropagationAction()
    expect(action.canExecute(context)).toBe(false)
  })

  it('should not execute for non-PortUpdated events', () => {
    const flow = new Flow()
    const event = newEvent(
      1,
      flow.id,
      FlowEventType.EdgeAdded,
      {
        edgeId: 'test',
        sourceNodeId: 'source',
        sourcePortId: 'out',
        targetNodeId: 'target',
        targetPortId: 'in',
        metadata: {},
      },
    )

    const context: ActionContext = {
      event,
      flow,
    }

    const action = new ValuePropagationAction()
    expect(action.canExecute(context)).toBe(false)
  })
})
