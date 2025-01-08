import type { NodeMetadata } from '@chaingraph/types/node/types'

import type { PortConfig } from '@chaingraph/types/port'

import { NodeRegistry } from '@chaingraph/types/node/registry'
import 'reflect-metadata'

const NODE_METADATA_KEY = Symbol('node:metadata')

export interface NodeMetadataReflect extends NodeMetadata {
  portsConfig: Map<string, PortConfig>
}

export function Node(config: NodeMetadata) {
  return function (constructor: any) {
    // Reflect.defineMetadata(NODE_METADATA_KEY, config, target)
    const metadata = getOrCreateNodeMetadata(constructor.prototype)
    Object.assign(metadata, config)

    if (!metadata.portsConfig) {
      metadata.portsConfig = new Map<string, PortConfig>()
    }

    NodeRegistry.getInstance().registerNode(constructor)
  }
}

export function getOrCreateNodeMetadata(target: any): NodeMetadataReflect {
  if (!Reflect.hasMetadata(NODE_METADATA_KEY, target)) {
    Reflect.defineMetadata(
      NODE_METADATA_KEY,
      {
        portsConfig: new Map<string, PortConfig>(),
      } as NodeMetadataReflect,
      target,
    )
  }
  return Reflect.getMetadata(NODE_METADATA_KEY, target)
}

export function getPortMetadata(node: any, fieldName: string): PortConfig | undefined {
  const metadata = getOrCreateNodeMetadata(node)
  return metadata?.portsConfig.get(fieldName)
}
