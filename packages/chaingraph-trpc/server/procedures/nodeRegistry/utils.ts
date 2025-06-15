/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode, NodeExecutionResult, NodeMetadata } from '@badaitech/chaingraph-types'
import { BaseNode, Input, Node, NodeRegistry, String } from '@badaitech/chaingraph-types'
import { v4 as uuidv4 } from 'uuid'

/**
 * Creates test node class
 */
@Node({
  type: 'TestNode',
  description: 'Test node for testing purposes',
})
export class TestNode extends BaseNode {
  constructor(id: string, metadata?: NodeMetadata) {
    super(id, metadata)
  }

  async execute(): Promise<any> {
    return { status: 'completed' }
  }
}

/**
 * Creates another test node class
 */
@Node({
  type: 'AnotherTestNode',
  description: 'Another test node',
})
export class AnotherTestNode extends BaseNode {
  @Input()
  @String({
    title: 'Input port',
    description: 'Input port for testing',
    defaultValue: '',
  })
  inputPort: string = ''

  // constructor(id: string, metadata?: NodeMetadata) {
  //   super(id, metadata)
  // }

  async execute(): Promise<NodeExecutionResult> {
    return {}
  }
}

/**
 * Register test nodes in registry
 */
export function registerTestNodes(): void {
  const registry = NodeRegistry.getInstance()
  registry.registerNode(TestNode)
  registry.registerNode(AnotherTestNode)
}

/**
 * Clean up test nodes from registry
 */
export function cleanupTestNodes(): void {
  const registry = NodeRegistry.getInstance()
  registry.clear()
}

/**
 * Creates a test node instance
 */
export function createTestNode(type: string = 'TestNode'): INode {
  return NodeRegistry.getInstance().createNode(type, `test_${uuidv4()}`)
}
