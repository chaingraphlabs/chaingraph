import type { INode, NodeMetadata } from '@chaingraph/types'
import { BaseNode, Input, Node, NodeRegistry, PortString } from '@chaingraph/types'
import { v4 as uuidv4 } from 'uuid'

/**
 * Creates test node class
 */
@Node({
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
  description: 'Another test node',
})
export class AnotherTestNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Input port',
    description: 'Input port for testing',
    defaultValue: '',
  })
  inputPort: string = ''

  constructor(id: string, metadata?: NodeMetadata) {
    super(id, metadata)
  }

  async execute(): Promise<any> {
    return { status: 'completed' }
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
