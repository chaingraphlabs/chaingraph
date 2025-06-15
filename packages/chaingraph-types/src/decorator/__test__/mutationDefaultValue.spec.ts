/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { BaseNode, findPort } from '../../node'
import { AnyPortPlugin, ArrayPortPlugin, EnumPortPlugin, NumberPortPlugin, ObjectPortPlugin, PortPluginRegistry, StreamPortPlugin, StringPortPlugin } from '../../port'
import { Node } from '../node.decorator'
import { Port } from '../port.decorator'
import 'reflect-metadata'

interface ObjectSchema {
  field1: string
}

// DummyNode class decorated with our new @Node and @Port decorators.
// The dummyPort property uses a configuration of type "string" with defaultValue "hello".
@Node({
  type: 'DummyNode',
  title: 'Dummy Node',
  description: 'A dummy node for testing port initialization',
})
class DummyNode extends BaseNode {
  @Port({
    type: 'object',
    schema: {
      properties: {
        field1: {
          type: 'string',
        },
      },
    },
  })
  testObject: ObjectSchema = {
    field1: 'val',
  }

  // For the sake of this test, execute is a stub.
  async execute(): Promise<any> {
    return Promise.resolve({})
  }
}

describe('port mutation Test', () => {
  beforeAll(() => {
    PortPluginRegistry.getInstance().register(StringPortPlugin)
    PortPluginRegistry.getInstance().register(NumberPortPlugin)
    PortPluginRegistry.getInstance().register(AnyPortPlugin)
    PortPluginRegistry.getInstance().register(StreamPortPlugin)
    PortPluginRegistry.getInstance().register(ArrayPortPlugin)
    PortPluginRegistry.getInstance().register(ObjectPortPlugin)
    PortPluginRegistry.getInstance().register(EnumPortPlugin)
  })

  it('should keep original default value due mutation current one', () => {
    // Create an instance of the dummy node.
    const node = new DummyNode('node1')

    // Call initialize() which calls processNodePorts internally.
    node.initialize()

    const ports = node.ports
    expect(ports).toBeDefined()

    const testObjectPortInstance = findPort(
      node,
      port => port.getConfig().key === 'testObject',
    )
    expect(testObjectPortInstance).toBeDefined()

    node.testObject.field1 = 'test'
    expect(testObjectPortInstance?.getValue().field1).toStrictEqual('test')
    expect(testObjectPortInstance?.getConfig().defaultValue.field1).toStrictEqual('val')
  })
})
