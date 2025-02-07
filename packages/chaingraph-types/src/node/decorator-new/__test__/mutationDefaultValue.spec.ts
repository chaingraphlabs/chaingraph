import { BaseNode } from '@badaitech/chaingraph-types/node/base-node'
import { findPort } from '@badaitech/chaingraph-types/node/traverse-ports'
import {
  ArrayPortPlugin,
  EnumPortPlugin,
  NumberPortPlugin,
  ObjectPortPlugin,
  StreamPortPlugin,
} from '@badaitech/chaingraph-types/port/plugins'
import { AnyPortPlugin } from '@badaitech/chaingraph-types/port/plugins/AnyPortPlugin'
import {
  StringPortPlugin,
} from '@badaitech/chaingraph-types/port/plugins/StringPortPlugin'
import { portRegistry } from '@badaitech/chaingraph-types/port/registry'
import { beforeAll, describe, expect, it } from 'vitest'
import { Node } from '../node.decorator'
import { Port } from '../port.decorator'
import 'reflect-metadata'

interface ObjectSchema {
  field1: string
}

// DummyNode class decorated with our new @Node and @Port decorators.
// The dummyPort property uses a configuration of type "string" with defaultValue "hello".
@Node({
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
    portRegistry.register(StringPortPlugin)
    portRegistry.register(NumberPortPlugin)
    portRegistry.register(AnyPortPlugin)
    portRegistry.register(StreamPortPlugin)
    portRegistry.register(ArrayPortPlugin)
    portRegistry.register(ObjectPortPlugin)
    portRegistry.register(EnumPortPlugin)
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
