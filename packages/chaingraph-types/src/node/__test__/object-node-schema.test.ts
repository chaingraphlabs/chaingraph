/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext } from '../../execution'
import type { IPort, ObjectPort } from '../../port'
import type { NodeExecutionResult } from '../types'
import { beforeAll, describe, expect, it } from 'vitest'
import { Id, Input, Node, Port } from '../../decorator'
import { findPort } from '../../node/traverse-ports'
import {
  ArrayPortPlugin,
  createObjectPortConfig,
  createStringConfig,
  EnumPortPlugin,
  NumberPortPlugin,
  ObjectPortPlugin,
  PortPluginRegistry,
  StreamPortPlugin,
  StringPortPlugin,
} from '../../port'
import { BaseNode } from '../base-node'
import { registerNodeTransformers } from '../json-transformers'
import 'reflect-metadata'

PortPluginRegistry.getInstance().register(StringPortPlugin)
PortPluginRegistry.getInstance().register(NumberPortPlugin)
PortPluginRegistry.getInstance().register(ArrayPortPlugin)
PortPluginRegistry.getInstance().register(ObjectPortPlugin)
PortPluginRegistry.getInstance().register(EnumPortPlugin)
PortPluginRegistry.getInstance().register(StreamPortPlugin)

class RecordObject implements Record<string, unknown> {
  [key: string]: unknown;
}

@Node({
  title: 'Object Node With dynamic schema',
  description: 'Node with an object port with dynamic schema',
})
class ObjectNode extends BaseNode {
  @Input()
  @Id('records')
  @Port({
    type: 'object',
    schema: {
      properties: {},
    },
    ui: {
      bgColor: '#e44df5',
      borderColor: '#541e5d',
    },
  })
  records: Record<string, unknown> = {}

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return { }
  }
}

describe('object node with dynamic schema serialization', () => {
  beforeAll(() => {
    // Register all port types
    registerNodeTransformers()
  })

  it('serializes and deserializes a node with an object port', async () => {
    const objectNode = new ObjectNode('object-node')
    await objectNode.initialize()

    const recordsPort = objectNode.getPort('records')
    if (!recordsPort) {
      throw new Error('Records port not found')
    }

    // expect the port to be an object port
    expect(recordsPort).toBeDefined()
    expect(recordsPort?.getConfig().type).toBe('object')

    objectNode.addObjectProperty(recordsPort, 'street', createStringConfig({
      defaultValue: '123 Main St',
      ui: {
        bgColor: '#e70d0d',
        borderColor: '#460707',
      },
    }))

    // await objectNode.initialize()

    // check if the port has the new field
    expect((recordsPort as ObjectPort).getConfig().schema.properties.street).toBeDefined()
    expect((recordsPort as ObjectPort).getConfig().schema.properties.street).toBeDefined()
    expect((recordsPort as ObjectPort).getConfig().schema.properties.street.type).toBe('string')
    expect((recordsPort as ObjectPort).getConfig().schema.properties.street.defaultValue).toBe('123 Main St')
    expect((recordsPort as ObjectPort).getValue()).toEqual({ street: '123 Main St' })

    expect(
      Array.from(objectNode.ports.values())
        .filter(port => !port.getConfig().metadata?.isSystemPort)
        .map((port) => {
          return port.getConfig().key
        }),
    ).toEqual(['records', 'street'])

    // expect the node port has the new field
    const streetPort = findPort(objectNode, (port) => {
      return port.getConfig().key === 'street'
    })

    expect(streetPort).toBeDefined()
    expect(streetPort?.getConfig().type).toBe('string')
    expect(streetPort?.getConfig().defaultValue).toBe('123 Main St')
    expect(streetPort?.getValue()).toBe('123 Main St')

    // serialize the node
    const serialized = objectNode.serialize()
    const serializedJson = JSON.stringify(serialized)

    // deserialize json string
    const deserialized = JSON.parse(serializedJson)
    const deserializedNode = new ObjectNode('object-node').deserialize(deserialized)

    expect(deserializedNode).toBeDefined()
    expect(deserializedNode.metadata).toEqual(objectNode.metadata)
    expect(deserializedNode.status).toEqual(objectNode.status)
    expect(deserializedNode.ports).toEqual(objectNode.ports)

    expect(
      Array.from(deserializedNode.ports.values())
        .filter(port => !port.getConfig().metadata?.isSystemPort)
        .map((port) => {
          return port.getConfig().key
        }),
    ).toEqual(['street', 'records'])

    // expect the deserialized node to have the new field
    const deserializedRecordsPort = deserializedNode.getPort('records') as ObjectPort
    expect(deserializedRecordsPort).toBeDefined()
    expect(deserializedRecordsPort?.getConfig().schema.properties.street).toBeDefined()
    expect(deserializedRecordsPort?.getConfig().schema.properties.street.type).toBe('string')
    expect(deserializedRecordsPort?.getConfig().schema.properties.street.defaultValue).toBe('123 Main St')
    expect(deserializedRecordsPort?.getValue()).toEqual({ street: '123 Main St' })

    // add one more field
    const recordsPort2 = objectNode.getPort('records')
    if (!recordsPort2) {
      throw new Error('Records port not found')
    }

    objectNode.addObjectProperty(recordsPort2, 'city', createObjectPortConfig({
      type: 'object',
      schema: {
        properties: {
          name: createStringConfig({
            defaultValue: 'Springfield',
            ui: {
              bgColor: '#e70d0d',
              borderColor: '#460707',
            },
          }),
          state: createStringConfig({
            defaultValue: 'IL',
            ui: {
              bgColor: '#e70d0d',
              borderColor: '#460707',
            },
          }),
        },
      },
      defaultValue: {
        name: 'Springfield',
        state: 'IL',
      },
      ui: {
        bgColor: '#e70d0d',
        borderColor: '#460707',
      },
    }))

    // check if the port has the new field
    expect((recordsPort2 as ObjectPort).getConfig().schema.properties.city).toBeDefined()
    expect((recordsPort2 as ObjectPort).getConfig().schema.properties.city.type).toBe('object')
    expect((recordsPort2 as ObjectPort).getConfig().schema.properties.city.defaultValue).toEqual({ name: 'Springfield', state: 'IL' })
    expect((recordsPort2 as ObjectPort).getValue()).toEqual({ street: '123 Main St', city: { name: 'Springfield', state: 'IL' } })

    expect(
      Array.from(objectNode.ports.values())
        .filter(port => !port.getConfig().metadata?.isSystemPort)
        .map((port) => {
          return port.getConfig().key
        }),
    ).toEqual(['records', 'street', 'city', 'name', 'state'])

    // expect the node port has the new field
    const cityPort = findPort(objectNode, (port) => {
      return port.getConfig().key === 'city'
    })

    expect(cityPort).toBeDefined()
    expect(cityPort?.getConfig().type).toBe('object')
    expect(cityPort?.getConfig().defaultValue).toEqual({ name: 'Springfield', state: 'IL' })
    expect(cityPort?.getValue()).toEqual({ name: 'Springfield', state: 'IL' })

    // serialize the node
    const serialized2 = objectNode.serialize()
    const serializedJson2 = JSON.stringify(serialized2)

    // deserialize json string
    const deserialized2 = JSON.parse(serializedJson2)
    const deserializedNode2 = new ObjectNode('object-node').deserialize(deserialized2)

    expect(deserializedNode2).toBeDefined()
    expect(deserializedNode2.metadata).toEqual(objectNode.metadata)
    expect(deserializedNode2.status).toEqual(objectNode.status)
    expect(deserializedNode2.ports).toEqual(objectNode.ports)

    // expect the deserialized node to have the new field
    const deserializedRecordsPort2 = deserializedNode2.getPort('records') as ObjectPort
    expect(deserializedRecordsPort2).toBeDefined()
    expect(deserializedRecordsPort2?.getConfig().schema.properties.street).toBeDefined()
    expect(deserializedRecordsPort2?.getConfig().schema.properties.street.type).toBe('string')
    expect(deserializedRecordsPort2?.getConfig().schema.properties.street.defaultValue).toBe('123 Main St')
    expect(deserializedRecordsPort2?.getValue()).toEqual({
      street: '123 Main St',
      city: { name: 'Springfield', state: 'IL' },
    })
    expect(deserializedRecordsPort2?.getConfig().schema.properties.city).toBeDefined()
    expect(deserializedRecordsPort2?.getConfig().schema.properties.city.type).toBe('object')
    expect(deserializedRecordsPort2?.getConfig().schema.properties.city.defaultValue).toEqual({ name: 'Springfield', state: 'IL' })

    // remove the field
    const recordsPort3 = objectNode.getPort('records') as ObjectPort
    objectNode.removeObjectProperty(recordsPort3 as IPort, 'city')

    // check if the port has the new field
    expect(recordsPort3.getConfig().schema.properties.city).toBeUndefined()
    expect(recordsPort3.getValue()).toEqual({ street: '123 Main St' })

    expect(
      Array.from(objectNode.ports.values())
        .filter(port => !port.getConfig().metadata?.isSystemPort)
        .map((port) => {
          return port.getConfig().key
        }),
    ).toEqual(['records', 'street'])

    // TODO: Restore the test!
    // const recordsPortConfig = objectNode.metadata.portsConfig?.get('records') as ObjectPortConfig
    // expect(Object.keys(recordsPortConfig.schema.properties)).toEqual(['street'])
  })
})
