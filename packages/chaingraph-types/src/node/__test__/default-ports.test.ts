/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext } from '../../execution'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Node } from '../../decorator/node.decorator'
import { Port } from '../../decorator/port.decorator'
import { PortPluginRegistry } from '../../port'
import { BooleanPortPlugin, NumberPortPlugin, StringPortPlugin } from '../../port/plugins'
import { BaseNodeCompositional } from '../base-node-compositional'
import 'reflect-metadata'

// Register port plugins for testing
beforeEach(() => {
  const registry = PortPluginRegistry.getInstance()
  registry.register(StringPortPlugin)
  registry.register(NumberPortPlugin)
  registry.register(BooleanPortPlugin)
})

/**
 * A test node with default flow ports enabled
 */
@Node({
  title: 'Default Ports Node',
  description: 'A test node with default flow ports',
  // No flowPorts config - should have all default ports
})
class DefaultPortsNode extends BaseNodeCompositional {
  @Port({
    type: 'string',
    direction: 'input',
  })
  input: string = 'test'

  @Port({
    type: 'string',
    direction: 'output',
  })
  output: string = ''

  async execute(context: ExecutionContext) {
    this.output = this.input.toUpperCase()
    return {}
  }
}

/**
 * A test node with disabled flow ports
 */
@Node({
  title: 'No Flow Ports Node',
  description: 'A test node with disabled flow ports',
  flowPorts: {
    disabledFlowPorts: true,
    disabledError: false,
  },
})
class NoFlowPortsNode extends BaseNodeCompositional {
  @Port({
    type: 'string',
    direction: 'input',
  })
  input: string = 'test'

  @Port({
    type: 'string',
    direction: 'output',
  })
  output: string = ''

  async execute(context: ExecutionContext) {
    this.output = this.input.toUpperCase()
    return {}
  }
}

/**
 * A test node with disabled error ports
 */
@Node({
  title: 'No Error Ports Node',
  description: 'A test node with disabled error ports',
  flowPorts: {
    disabledFlowPorts: false,
    disabledError: true,
  },
})
class NoErrorPortsNode extends BaseNodeCompositional {
  @Port({
    type: 'string',
    direction: 'input',
  })
  input: string = 'test'

  @Port({
    type: 'string',
    direction: 'output',
  })
  output: string = ''

  async execute(context: ExecutionContext) {
    this.output = this.input.toUpperCase()
    return {}
  }
}

/**
 * A test node with both flow and error ports disabled
 */
@Node({
  title: 'All Disabled Ports Node',
  description: 'A test node with all default ports disabled',
  flowPorts: {
    disabledFlowPorts: true,
    disabledError: true,
  },
})
class AllDisabledPortsNode extends BaseNodeCompositional {
  @Port({
    type: 'string',
    direction: 'input',
  })
  input: string = 'test'

  @Port({
    type: 'string',
    direction: 'output',
  })
  output: string = ''

  async execute(context: ExecutionContext) {
    this.output = this.input.toUpperCase()
    return {}
  }
}

describe('default Ports', () => {
  describe('default configuration', () => {
    let node: DefaultPortsNode

    beforeEach(() => {
      node = new DefaultPortsNode('test-node')
      node.initialize()
    })

    it('should have all default ports created during initialization', () => {
      // Should have 4 default ports plus 2 user-defined ports
      expect(node.ports.size).toBe(6)

      // Check default ports exist
      expect(node.getFlowInPort()).toBeDefined()
      expect(node.getFlowOutPort()).toBeDefined()
      expect(node.getErrorPort()).toBeDefined()
      expect(node.getErrorMessagePort()).toBeDefined()
    })

    it('should identify default ports correctly', () => {
      const flowInPort = node.getFlowInPort()
      expect(flowInPort).toBeDefined()
      expect(node.isDefaultPort(flowInPort!.id)).toBe(true)

      // A user port should not be identified as default
      const userPort = node.findPortByKey('input')
      expect(userPort).toBeDefined()
      expect(node.isDefaultPort(userPort!.id)).toBe(false)
    })

    it('should execute when flowIn is true', async () => {
      const flowInPort = node.getFlowInPort()
      expect(flowInPort).toBeDefined()
      flowInPort!.setValue(true)

      const result = await node.executeWithDefaultPorts({
        startTime: new Date(),
        flowId: 'test-flow',
        executionId: 'test-execution',
        metadata: {},
        abortController: new AbortController(),
        abortSignal: new AbortController().signal,
      } as ExecutionContext)

      // expect(result.status).toBe(NodeExecutionStatus.Completed)
      expect(node.output).toBe('TEST')
    })

    it('should not execute when flowIn is false', async () => {
      const flowInPort = node.getFlowInPort()
      expect(flowInPort).toBeDefined()
      flowInPort!.setValue(false)

      const result = await node.executeWithDefaultPorts({
        startTime: new Date(),
        flowId: 'test-flow',
        executionId: 'test-execution',
        metadata: {},
        abortController: new AbortController(),
        abortSignal: new AbortController().signal,
      } as ExecutionContext)

      // expect(result.status).toBe(NodeExecutionStatus.Skipped)
      // Output should not be changed
      expect(node.output).toBe('')
    })

    it('should update flowOut port after successful execution', async () => {
      const flowInPort = node.getFlowInPort()
      const flowOutPort = node.getFlowOutPort()
      expect(flowInPort).toBeDefined()
      expect(flowOutPort).toBeDefined()

      // Reset flowOut to false to verify it gets updated
      flowOutPort!.setValue(false)

      // Execute the node
      await node.executeWithDefaultPorts({
        startTime: new Date(),
        flowId: 'test-flow',
        executionId: 'test-execution',
        metadata: {},
        abortController: new AbortController(),
        abortSignal: new AbortController().signal,
      } as ExecutionContext)

      // After successful execution, flowOut should be true
      expect(flowOutPort!.getValue()).toBe(true)
    })

    it('should update error ports on execution failure', async () => {
      const errorPort = node.getErrorPort()
      const errorMessagePort = node.getErrorMessagePort()
      expect(errorPort).toBeDefined()
      expect(errorMessagePort).toBeDefined()

      // Mock executeNode to throw an error
      vi.spyOn(node, 'execute').mockRejectedValueOnce(new Error('Test error'))

      // Execute the node
      const result = await node.executeWithDefaultPorts({
        startTime: new Date(),
        flowId: 'test-flow',
        executionId: 'test-execution',
        metadata: {},
        abortController: new AbortController(),
        abortSignal: new AbortController().signal,
      } as ExecutionContext)

      // Check result status
      // expect(result.status).toBe(NodeExecutionStatus.Error)

      // Error port should be true and error message port should have the error message
      expect(errorPort!.getValue()).toBe(true)
      expect(errorMessagePort!.getValue()).toBe('Test error')
    })

    it('should preserve default port values through serialization', async () => {
      // Change some default port values
      const flowInPort = node.getFlowInPort()
      const errorPort = node.getErrorPort()
      expect(flowInPort).toBeDefined()
      expect(errorPort).toBeDefined()

      flowInPort!.setValue(false)
      errorPort!.setValue(true)

      // Serialize the node
      const serialized = node.serialize()

      // Create a new node and deserialize
      const newNode = new DefaultPortsNode('test-node')
      newNode.deserialize(serialized)
      newNode.initialize()

      // Check that default port values were preserved
      const newFlowInPort = newNode.getFlowInPort()
      const newErrorPort = newNode.getErrorPort()
      expect(newFlowInPort).toBeDefined()
      expect(newErrorPort).toBeDefined()

      expect(newFlowInPort!.getValue()).toBe(false)
      expect(newErrorPort!.getValue()).toBe(true)
    })
  })

  describe('custom flow port configurations', () => {
    it('should not create flow ports when disabled', () => {
      const node = new NoFlowPortsNode('test-node')
      node.initialize()

      // Should have 2 user ports + 2 error ports (flow ports disabled)
      expect(node.ports.size).toBe(4)

      // Flow ports should not be present
      expect(node.getFlowInPort()).toBeUndefined()
      expect(node.getFlowOutPort()).toBeUndefined()

      // Error ports should be present
      expect(node.getErrorPort()).toBeDefined()
      expect(node.getErrorMessagePort()).toBeDefined()
    })

    it('should not create error ports when disabled', () => {
      const node = new NoErrorPortsNode('test-node')
      node.initialize()

      // Should have 2 user ports + 2 flow ports (error ports disabled)
      expect(node.ports.size).toBe(4)

      // Flow ports should be present
      expect(node.getFlowInPort()).toBeDefined()
      expect(node.getFlowOutPort()).toBeDefined()

      // Error ports should not be present
      expect(node.getErrorPort()).toBeUndefined()
      expect(node.getErrorMessagePort()).toBeUndefined()
    })

    it('should not create any default ports when all are disabled', () => {
      const node = new AllDisabledPortsNode('test-node')
      node.initialize()

      // Should have only 2 user ports (all default ports disabled)
      expect(node.ports.size).toBe(2)

      // No default ports should be present
      expect(node.getFlowInPort()).toBeUndefined()
      expect(node.getFlowOutPort()).toBeUndefined()
      expect(node.getErrorPort()).toBeUndefined()
      expect(node.getErrorMessagePort()).toBeUndefined()
    })

    it('should always execute when flow ports are disabled and auto-execution is enabled', async () => {
      const node = new NoFlowPortsNode('test-node')
      node.initialize()

      const result = await node.executeWithDefaultPorts({
        startTime: new Date(),
        flowId: 'test-flow',
        executionId: 'test-execution',
        metadata: {},
        abortController: new AbortController(),
        abortSignal: new AbortController().signal,
      } as ExecutionContext)

      // Should execute even without flow ports
      // expect(result.status).toBe(NodeExecutionStatus.Completed)
      expect(node.output).toBe('TEST')
    })

    it('should not execute when flow ports are disabled but auto-execution is disabled', async () => {
      // Create a node with disabled flow ports and disabled auto-execution
      @Node({
        title: 'Manual Execution Node',
        flowPorts: {
          disabledFlowPorts: true,
          disabledAutoExecution: true,
        },
      })
      class ManualExecutionNode extends BaseNodeCompositional {
        @Port({ type: 'string', direction: 'input' })
        input: string = 'test'

        @Port({ type: 'string', direction: 'output' })
        output: string = ''

        async execute(context: ExecutionContext) {
          this.output = this.input.toUpperCase()
          return {}
        }
      }

      const node = new ManualExecutionNode('test-node')
      node.initialize()

      const result = await node.executeWithDefaultPorts({
        startTime: new Date(),
        flowId: 'test-flow',
        executionId: 'test-execution',
        metadata: {},
        abortController: new AbortController(),
        abortSignal: new AbortController().signal,
      } as ExecutionContext)

      // Should skip execution
      // expect(result.status).toBe(NodeExecutionStatus.Skipped)
      expect(node.output).toBe('')
    })
  })
})
