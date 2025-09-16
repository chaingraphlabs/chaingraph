/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPortConfig } from '../../port'
import { describe, expect, it } from 'vitest'
import { Input, Node, ObjectSchema, Output, PortObject, PortString, Title } from '../../decorator'
import { NodeRegistry } from '../../decorator/registry'
import { ExecutionContext } from '../../execution/execution-context'
import { BaseNode } from '../../node/base-node'
import { ExecutionEngine } from '../execution-engine'
import { ExecutionEventEnum } from '../execution-events'
import { Flow } from '../flow'

// Mock EventListenerNode with same structure as real one
@ObjectSchema({
  description: 'Event data emitted by the listener',
})
class EventData {
  @Title('Event Name')
  @PortString({ defaultValue: '' })
  eventName: string = ''
}

@Node({
  type: 'EventListenerNode',
  title: 'Event Listener',
  flowPorts: {
    disabledAutoExecution: true,
  },
})
class MockEventListenerNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Event Name',
    defaultValue: '',
  })
  eventName: string = ''

  @Output()
  @PortObject({
    title: 'Event Data',
    schema: EventData,
  })
  outputData: EventData = new EventData()

  async execute(context: ExecutionContext) {
    if (!context.eventData) {
      this.outputData = new EventData()
      return {}
    }

    const { eventName } = context.eventData
    if (eventName === this.eventName) {
      this.outputData.eventName = eventName
    }
    return {}
  }
}

// Mock EventEmitterNode
@Node({
  type: 'EventEmitterNode',
  title: 'Event Emitter',
})
class MockEventEmitterNode extends BaseNode {
  @Input()
  @PortObject({
    title: 'Event Data',
    schema: EventData,
  })
  eventData: EventData = new EventData()

  async execute(context: ExecutionContext) {
    const eventName = this.eventData.eventName
    if (eventName) {
      context.emitEvent?.(eventName, this.eventData, this.id)
    }
    return {}
  }
}

describe('eventListener execution with real nodes', () => {
  it('should not execute EventListenerNode in parent context when loaded from JSON', async () => {
    // Register the real nodes
    NodeRegistry.getInstance().registerNode(MockEventListenerNode)
    NodeRegistry.getInstance().registerNode(MockEventEmitterNode)

    // Simple node to ensure something executes
    @Node({
      type: 'SimpleNode',
      title: 'Simple Node',
    })
    class SimpleNode extends BaseNode {
      async execute(context: ExecutionContext) {
        return {}
      }
    }
    NodeRegistry.getInstance().registerNode(SimpleNode)

    // Create a flow JSON similar to the user's flow
    const flowJSON = {
      id: 'test-flow',
      edges: [],
      nodes: [
        {
          id: 'EventListenerNode:listener1',
          ports: {
            'execute:POexec1': {
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
          id: 'SimpleNode:simple1',
          ports: {
            'execute:POexec2': {
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
            type: 'SimpleNode',
            title: 'Simple Node',
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

    // Initialize all nodes
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
      'test-execution',
      undefined, // no parent
      undefined, // no event data
      false, // not a child execution
    )

    // Track which nodes executed
    const executedNodes: string[] = []

    // Create and run engine
    const engine = new ExecutionEngine(flow as Flow, context)
    engine.on(ExecutionEventEnum.NODE_STARTED, (event) => {
      executedNodes.push(event.data.node.id)
    })

    // Add flow completed handler to capture execution state
    let flowCompleted = false
    engine.on(ExecutionEventEnum.FLOW_COMPLETED, () => {
      flowCompleted = true
    })

    await engine.execute()

    // EventListenerNode should NOT execute
    expect(executedNodes).not.toContain('EventListenerNode:listener1')

    // SimpleNode should execute
    expect(executedNodes).toContain('SimpleNode:simple1')

    // Flow should complete successfully
    expect(flowCompleted).toBe(true)
  })

  it('should execute EventListenerNode in child context with matching event', async () => {
    // Register the real nodes
    NodeRegistry.getInstance().registerNode(MockEventListenerNode)
    NodeRegistry.getInstance().registerNode(MockEventEmitterNode)

    // Create a flow with EventEmitterNode and EventListenerNode
    const flowJSON = {
      id: 'test-flow',
      edges: [],
      nodes: [
        {
          id: 'EventEmitterNode:emitter1',
          ports: {
            'execute:POexec1': {
              value: true,
              config: {
                key: '__execute',
                type: 'boolean',
                direction: 'input',
                connections: [],
                defaultValue: true,
                metadata: { isSystemPort: true },
              },
            },
            'eventData:POevent': {
              value: { eventName: 'test-event' },
              config: {
                key: 'eventData',
                type: 'object',
                schema: {
                  properties: {
                    eventName: {
                      type: 'string',
                      defaultValue: 'test-event',
                      ui: {
                        label: 'Event Name',
                      },
                    },
                  },
                },
              },
            },
          },
          status: 'initialized',
          metadata: {
            type: 'EventEmitterNode',
            title: 'Event Emitter',
            version: 1,
          },
        },
        {
          id: 'EventListenerNode:listener1',
          ports: {
            'execute:POexec2': {
              value: true,
              config: {
                key: '__execute',
                type: 'boolean',
                direction: 'input',
                connections: [],
                defaultValue: true,
                metadata: { isSystemPort: true },
              },
            },
            'eventName:POeventName': {
              value: 'test-event',
              config: {
                key: 'eventName',
                type: 'string',
                direction: 'input',
                connections: [],
                defaultValue: 'test-event',
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
      ],
      metadata: {
        id: 'test-flow',
        name: 'Test Flow',
      },
    }

    // Deserialize the flow
    const flow = Flow.deserialize(flowJSON)

    // Initialize all nodes
    for (const node of flow.nodes.values()) {
      const portsConfig = new Map<string, IPortConfig>()
      for (const port of node.ports.values()) {
        portsConfig.set(port.getConfig().key!, port.getConfig())
      }
      node.initialize(portsConfig)
    }

    // Create parent execution context
    const abortController = new AbortController()
    const context = new ExecutionContext(
      flow.id,
      abortController,
      undefined,
      'test-execution',
      {},
      'test-execution',
      undefined,
      undefined,
      false,
    )

    // Enable event emission
    context.emittedEvents = []
    context.emitEvent = (eventName: string, data: any) => {
      context.emittedEvents!.push({
        id: `test-${Date.now()}`,
        type: eventName,
        data,
        emittedAt: Date.now(),
        emittedBy: context.currentNodeId || 'unknown',
        processed: false,
      })
    }

    // Track parent and child executions
    const parentExecutedNodes: string[] = []
    const childExecutions: { eventName: string, executedNodes: string[] }[] = []

    // Create parent engine
    const engine = new ExecutionEngine(flow as Flow, context)
    engine.on(ExecutionEventEnum.NODE_STARTED, (event) => {
      parentExecutedNodes.push(event.data.node.id)
    })

    // Set up event callback to spawn child executions
    engine.setEventCallback(async (ctx) => {
      const unprocessedEvents = ctx.emittedEvents!.filter(e => !e.processed)

      for (const event of unprocessedEvents) {
        // Create child execution
        const childAbortController = new AbortController()
        const childContext = new ExecutionContext(
          flow.id,
          childAbortController,
          undefined,
          'child-execution',
          {},
          'test-execution', // parent ID
          'test-execution', // parent ID
          { eventName: event.type, payload: event.data },
          true, // is child execution
        )

        const childExecutedNodes: string[] = []
        const childEngine = new ExecutionEngine(flow as Flow, childContext)
        childEngine.on(ExecutionEventEnum.NODE_STARTED, (event) => {
          childExecutedNodes.push(event.data.node.id)
        })

        await childEngine.execute()

        childExecutions.push({
          eventName: event.type,
          executedNodes: childExecutedNodes,
        })

        event.processed = true
      }
    })

    await engine.execute()

    // In parent context: only EventEmitterNode should execute
    expect(parentExecutedNodes).toContain('EventEmitterNode:emitter1')
    expect(parentExecutedNodes).not.toContain('EventListenerNode:listener1')

    // Check that an event was emitted
    expect(context.emittedEvents).toHaveLength(1)
    expect(context.emittedEvents![0].type).toBe('test-event')

    // In child context: EventListenerNode should execute
    expect(childExecutions).toHaveLength(1)
    expect(childExecutions[0].eventName).toBe('test-event')
    expect(childExecutions[0].executedNodes).toContain('EventListenerNode:listener1')
  })
})
