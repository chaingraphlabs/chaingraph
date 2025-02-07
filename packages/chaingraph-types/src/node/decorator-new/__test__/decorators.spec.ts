import type { StringPortConfig } from '@badaitech/chaingraph-types/port/base'
import { createStringValue } from '@badaitech/chaingraph-types/port/plugins'
import { describe, expect, it } from 'vitest'
import { Node } from '../node.decorator'
import { Port } from '../port.decorator'
import 'reflect-metadata'

// Create a dummy node class with decorators
@Node({
  title: 'Dummy Node',
  description: 'A dummy node for testing',
})
class DummyNode {
  @Port({
    type: 'string',
    defaultValue: 'hello',
    nodeId: 'dummyNodeId',
  })
  public dummyPort!: string

  @Port({
    type: 'number',
    defaultValue: 123,
  })
  public numberPort!: number
}

describe('decorator tests', () => {
  it('should store node metadata', () => {
    // Retrieve metadata from the class constructor
    const nodeMetadata = Reflect.getMetadata('chaingraph:node-config', DummyNode)
    expect(nodeMetadata).toBeDefined()
    expect(nodeMetadata.type).toBe('DummyNode')
    expect(nodeMetadata.title).toBe('Dummy Node')
  })

  it('should store port metadata', () => {
    // Retrieve ports metadata from the class constructor
    const portsMetadata: Map<string | symbol, StringPortConfig>
      = Reflect.getMetadata('chaingraph:ports-config', DummyNode)
    expect(portsMetadata).toBeDefined()
    // Check that property "dummyPort" exists
    expect(portsMetadata.has('dummyPort')).toBeTruthy()

    const portConfig = portsMetadata.get('dummyPort')
    expect(portConfig).toBeDefined()
    expect(portConfig?.type).toBe('string')
    expect(portConfig?.defaultValue).toStrictEqual(createStringValue('hello'))
  })
})
