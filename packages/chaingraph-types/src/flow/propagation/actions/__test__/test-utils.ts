/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext } from '../../../../execution'
import type { IFlow } from '../../../../flow/interface'
import type { NodeEvent, NodeExecutionResult, PortUpdateEvent } from '../../../../node'
import type { AnyPort, IPort } from '../../../../port'
import {
  Input,
  Node,
  ObjectSchema,
  Output,
  PortAny,
  PortArray,
  PortArrayNumber,
  PortArrayObject,
  PortArrayString,
  PortBoolean,
  PortNumber,
  PortObject,
  PortString,
} from '../../../../decorator'
import { NodeEventType } from '../../../../node'
import { BaseNode } from '../../../../node'

/**
 * Object schema for test user profile
 */
@ObjectSchema({
  description: 'Test User Profile Schema',
})
class UserProfile {
  @PortString({ defaultValue: 'Anonymous' })
  name: string = 'Anonymous'

  @PortNumber({ defaultValue: 18, min: 18 })
  age: number = 18
}

/**
 * Object schema for test product
 */
@ObjectSchema({
  description: 'Test Product Schema',
})
class Product {
  @PortString({ defaultValue: 'Product' })
  id: string = 'Product'

  @PortNumber({ defaultValue: 0, min: 0 })
  value: number = 0
}

/**
 * Test node with string ports
 */
@Node({
  title: 'String Test Node',
  description: 'Node for testing string ports',
  type: 'StringNode',
})
export class StringNode extends BaseNode {
  @Input()
  @PortString({ title: 'String Input' })
  in: string = ''

  @Output()
  @PortString({ title: 'String Output' })
  out: string = ''

  execute(_context: ExecutionContext): Promise<NodeExecutionResult> {
    this.out = this.in
    return Promise.resolve({})
  }
}

/**
 * Test node with number ports
 */
@Node({
  title: 'Number Test Node',
  description: 'Node for testing number ports',
  type: 'NumberNode',
})
export class NumberNode extends BaseNode {
  @Input()
  @PortNumber({ title: 'Number Input' })
  in: number = 0

  @Output()
  @PortNumber({ title: 'Number Output' })
  out: number = 0

  execute(_context: ExecutionContext): Promise<NodeExecutionResult> {
    this.out = this.in
    return Promise.resolve({})
  }
}

/**
 * Test node with boolean ports
 */
@Node({
  title: 'Boolean Test Node',
  description: 'Node for testing boolean ports',
  type: 'BooleanNode',
})
export class BooleanNode extends BaseNode {
  @Input()
  @PortBoolean({ title: 'Boolean Input' })
  in: boolean = false

  @Output()
  @PortBoolean({ title: 'Boolean Output' })
  out: boolean = false

  execute(_context: ExecutionContext): Promise<NodeExecutionResult> {
    this.out = this.in
    return Promise.resolve({})
  }
}

/**
 * Test node with any ports
 */
@Node({
  title: 'Any Test Node',
  description: 'Node for testing any ports',
  type: 'AnyNode',
})
export class AnyNode extends BaseNode {
  @Input()
  @PortAny({ title: 'Any Input' })
  in: any = undefined

  @Output()
  @PortAny({ title: 'Any Output' })
  out: any = undefined

  execute(_context: ExecutionContext): Promise<NodeExecutionResult> {
    this.out = this.in
    return Promise.resolve({})
  }

  async onEvent(event: NodeEvent): Promise<void> {
    await super.onEvent(event)

    // propagate the input any underlying type to the output
    if (event.type === NodeEventType.PortUpdate) {
      const portUpdateEvent = event as PortUpdateEvent
      if (portUpdateEvent.port.key === 'in') {
        const inputAnyPort = portUpdateEvent.port as AnyPort
        const inputUnderlyingType = inputAnyPort.unwrapUnderlyingType()
        if (!inputUnderlyingType) {
          return
        }

        const outputAnyPort = this.findPortByKey('out') as AnyPort
        if (!outputAnyPort) {
          return
        }

        // Update the output port's underlying type
        outputAnyPort.setUnderlyingType(inputUnderlyingType)
        this.refreshAnyPortUnderlyingPorts(outputAnyPort as IPort)
      }
    }
  }
}

/**
 * Test node with object ports
 */
@Node({
  title: 'Object Test Node',
  description: 'Node for testing object ports',
  type: 'ObjectNode',
})
export class ObjectNode extends BaseNode {
  @Input()
  @PortObject({
    title: 'Object Input',
    schema: UserProfile,
    isSchemaMutable: true,
  })
  in: UserProfile = new UserProfile()

  @Output()
  @PortObject({
    title: 'Object Output',
    schema: UserProfile,
  })
  out: UserProfile = new UserProfile()

  execute(_context: ExecutionContext): Promise<NodeExecutionResult> {
    this.out = this.in
    return Promise.resolve({})
  }
}

/**
 * Test node with mutable object ports
 */
@Node({
  title: 'Mutable Object Test Node',
  description: 'Node for testing mutable object ports',
  type: 'MutableObjectNode',
})
export class MutableObjectNode extends BaseNode {
  @Input()
  @PortObject({
    title: 'Mutable Object Input',
    schema: { properties: {} },
    isSchemaMutable: true,
  })
  in: any = {}

  @Output()
  @PortObject({
    title: 'Mutable Object Output',
    schema: { properties: {} },
    isSchemaMutable: true,
  })
  out: any = {}

  execute(_context: ExecutionContext): Promise<NodeExecutionResult> {
    this.out = this.in
    return Promise.resolve({})
  }
}

/**
 * Test node with array ports
 */
@Node({
  title: 'Array String Test Node',
  description: 'Node for testing string array ports',
  type: 'ArrayStringNode',
})
export class ArrayStringNode extends BaseNode {
  @Input()
  @PortArrayString({ title: 'String Array Input' })
  in: string[] = []

  @Output()
  @PortArrayString({ title: 'String Array Output' })
  out: string[] = []

  execute(_context: ExecutionContext): Promise<NodeExecutionResult> {
    this.out = this.in
    return Promise.resolve({})
  }
}

/**
 * Test node with number array ports
 */
@Node({
  title: 'Array Number Test Node',
  description: 'Node for testing number array ports',
  type: 'ArrayNumberNode',
})
export class ArrayNumberNode extends BaseNode {
  @Input()
  @PortArrayNumber({ title: 'Number Array Input' })
  in: number[] = []

  @Output()
  @PortArrayNumber({ title: 'Number Array Output' })
  out: number[] = []

  execute(_context: ExecutionContext): Promise<NodeExecutionResult> {
    this.out = this.in
    return Promise.resolve({})
  }
}

/**
 * Test node with object array ports
 */
@Node({
  title: 'Array Object Test Node',
  description: 'Node for testing object array ports',
  type: 'ArrayObjectNode',
})
export class ArrayObjectNode extends BaseNode {
  @Input()
  @PortArrayObject(Product, {
    title: 'Object Array Input',
  })
  in: Product[] = []

  @Output()
  @PortArrayObject(Product, {
    title: 'Object Array Output',
  })
  out: Product[] = []

  execute(_context: ExecutionContext): Promise<NodeExecutionResult> {
    this.out = this.in
    return Promise.resolve({})
  }
}

/**
 * Test node with generic array ports
 */
@Node({
  title: 'Array Any Test Node',
  description: 'Node for testing any array ports',
  type: 'ArrayAnyNode',
})
export class ArrayAnyNode extends BaseNode {
  @Input()
  @PortArray({
    title: 'Any Array Input',
    itemConfig: { type: 'any' },
  })
  in: any[] = []

  @Output()
  @PortArray({
    title: 'Any Array Output',
    itemConfig: { type: 'any' },
  })
  out: any[] = []

  execute(_context: ExecutionContext): Promise<NodeExecutionResult> {
    this.out = this.in
    return Promise.resolve({})
  }
}

/**
 * Test node with mixed port types
 */
@Node({
  title: 'Mixed Test Node',
  description: 'Node for testing mixed port types',
  type: 'MixedNode',
})
export class MixedNode extends BaseNode {
  @Input()
  @PortString({ title: 'String Input' })
  stringIn: string = ''

  @Input()
  @PortNumber({ title: 'Number Input' })
  numberIn: number = 0

  @Input()
  @PortAny({ title: 'Any Input' })
  anyIn: any = undefined

  @Output()
  @PortString({ title: 'String Output' })
  stringOut: string = ''

  @Output()
  @PortNumber({ title: 'Number Output' })
  numberOut: number = 0

  @Output()
  @PortAny({ title: 'Any Output' })
  anyOut: any = undefined

  execute(_context: ExecutionContext): Promise<NodeExecutionResult> {
    this.stringOut = this.stringIn
    this.numberOut = this.numberIn
    this.anyOut = this.anyIn
    return Promise.resolve({})
  }
}

/**
 * Helper to initialize a node
 */
export function createNode<T extends BaseNode>(NodeClass: new (id: string, metadata: any) => T, id: string): T {
  const node = new NodeClass(id, { type: 'test' })
  node.initialize()
  return node
}

/**
 * Helper to create and connect two nodes
 */
export async function createConnectedNodes<S extends BaseNode, T extends BaseNode>(
  flow: IFlow,
  SourceNodeClass: new (id: string, metadata: any) => S,
  TargetNodeClass: new (id: string, metadata: any) => T,
  sourcePortKey: string,
  targetPortKey: string,
  sourceNodeId: string = 'source',
  targetNodeId: string = 'target',
): Promise<{ sourceNode: S, targetNode: T, edge: any }> {
  const sourceNode = createNode(SourceNodeClass, sourceNodeId)
  const targetNode = createNode(TargetNodeClass, targetNodeId)

  await Promise.all([
    flow.addNode(sourceNode),
    flow.addNode(targetNode),
  ])

  const sourcePort = sourceNode.findPortByKey(sourcePortKey)
  const targetPort = targetNode.findPortByKey(targetPortKey)

  if (!sourcePort || !targetPort) {
    throw new Error(`Ports not found: ${sourcePortKey} or ${targetPortKey}`)
  }

  const edge = await flow.connectPorts(sourceNode.id, sourcePort.id, targetNode.id, targetPort.id)

  return { sourceNode, targetNode, edge }
}
