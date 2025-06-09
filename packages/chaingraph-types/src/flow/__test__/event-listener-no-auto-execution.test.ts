/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { describe, expect, it } from 'vitest'
import { Node } from '../../decorator'
import { NodeRegistry } from '../../decorator/registry'
import { ExecutionContext } from '../../execution/execution-context'
import { BaseNode } from '../../node/base-node'
import { ExecutionEngine } from '../execution-engine'
import { ExecutionEventEnum } from '../execution-events'
import { Flow } from '../flow'

describe('eventListener no auto-execution from JSON', () => {
  // Register a mock EventListenerNode with disabledAutoExecution
  @Node({
    type: 'EventListenerNode',
    title: 'Event Listener',
    flowPorts: {
      disabledAutoExecution: true,
    },
  })
  class MockEventListenerNode extends BaseNode {
    async execute(context: ExecutionContext) {
      return {}
    }
  }

  // Register a normal node
  @Node({
    type: 'DebugLogNode',
    title: 'Debug Log',
  })
  class MockDebugLogNode extends BaseNode {
    async execute(context: ExecutionContext) {
      return {}
    }
  }

  it('should not execute EventListenerNode when loading flow from JSON', async () => {
    // Register nodes
    NodeRegistry.getInstance().registerNode(MockEventListenerNode)
    NodeRegistry.getInstance().registerNode(MockDebugLogNode)

    // Create a flow JSON similar to what the user has
    const flowJSON = {
      id: 'test-flow',
      edges: [],
      nodes: [
        {
          id: 'EventListenerNode:NOTQjgR49F3P7i7nPa',
          ports: {
            'execute:POi83ma9ibmrGmFJwX': {
              value: true,
              config: {
                key: '__execute',
                type: 'boolean',
                direction: 'input',
                connections: [],
                defaultValue: true,
              },
            },
          },
          status: 'initialized',
          metadata: {
            type: 'EventListenerNode',
            title: 'Event Listener',
            version: 1,
          },
        },
        {
          id: 'DebugLogNode:NOmxDbjrjpFqLDFb3H',
          ports: {
            'execute:POQ4p4rU7W3UREQxy3': {
              value: true,
              config: {
                key: '__execute',
                type: 'boolean',
                direction: 'input',
                connections: [],
                defaultValue: true,
              },
            },
          },
          status: 'initialized',
          metadata: {
            type: 'DebugLogNode',
            title: 'Debug Log',
            version: 1,
          },
        },
      ],
      metadata: {
        id: 'test-flow',
        name: 'Test Flow',
      },
    }

    // Deserialize the flow
    const flow = Flow.deserialize(flowJSON)

    // Check what nodes we have
    const eventListenerNode = flow.nodes.get('EventListenerNode:NOTQjgR49F3P7i7nPa')

    // Initialize nodes
    for (const node of flow.nodes.values()) {
      node.initialize()
    }

    // Create parent execution context
    const abortController = new AbortController()
    const context = new ExecutionContext(
      flow.id,
      abortController,
      undefined,
      'test-execution',
      {},
      undefined, // no parent
      undefined, // no event data
      false, // not a child execution
    )

    // Track which nodes executed
    const executedNodes: string[] = []

    // Create and run engine
    const engine = new ExecutionEngine(flow, context)
    engine.on(ExecutionEventEnum.NODE_STARTED, (event) => {
      executedNodes.push(event.data.node.metadata.type)
    })

    await engine.execute()

    // EventListenerNode should NOT execute
    expect(executedNodes).not.toContain('EventListenerNode')

    // DebugLogNode should execute
    expect(executedNodes).toContain('DebugLogNode')
  })
})
