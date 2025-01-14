import type { NodeMetadata } from '@chaingraph/types/node/types'

import type { PortConfig } from '@chaingraph/types/port'

import { NodeCategory } from '@chaingraph/types/node/node-enums'
import { NodeRegistry } from '@chaingraph/types/node/registry'
import 'reflect-metadata'

const NODE_METADATA_KEY = Symbol('node:metadata')

export function Node(config: Omit<NodeMetadata, 'type'>, nodeRegistry?: NodeRegistry | null) {
  return function (constructor: any) {
    if (!constructor.prototype) {
      throw new Error('Node decorator can only be applied to classes')
    }

    const metadata = getOrCreateNodeMetadata(constructor.prototype)
    Object.assign(metadata, config)

    metadata.type = constructor.name

    if (config.id) {
      metadata.id = config.id
    }

    if (!metadata.portsConfig) {
      metadata.portsConfig = new Map<string, PortConfig>()
    }

    Reflect.defineMetadata(NODE_METADATA_KEY, metadata, constructor)

    if (nodeRegistry !== undefined) {
      if (nodeRegistry !== null) {
        nodeRegistry.registerNode(constructor)
      }
    } else {
      NodeRegistry.getInstance().registerNode(constructor)
    }
  }
}

export function getOrCreateNodeMetadata(target: any): NodeMetadata {
  if (!target || !target.constructor) {
    throw new Error('Node decorator can only be applied to classes')
  }

  if (!Reflect.hasMetadata(NODE_METADATA_KEY, target)) {
    const nodeMetadata: NodeMetadata = {
      type: '',
      category: NodeCategory.Custom,
      portsConfig: new Map<string, PortConfig>(),
    }

    Reflect.defineMetadata(NODE_METADATA_KEY, nodeMetadata, target)
  }

  return Reflect.getMetadata(NODE_METADATA_KEY, target)
}

export function getPortMetadata(node: any, fieldName: string): PortConfig | undefined {
  return getOrCreateNodeMetadata(node)?.portsConfig?.get(fieldName)
}
