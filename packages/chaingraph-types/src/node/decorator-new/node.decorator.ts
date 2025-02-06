import type { NodeMetadata, NodeRegistry } from '@chaingraph/types/node'
import { getOrCreateNodeMetadata } from '@chaingraph/types/node'

import 'reflect-metadata'

/**
 * Node decorator that stores node metadata.
 * It uses the already existing NodeMetadata type.
 */
export function Node(config: Omit<NodeMetadata, 'type'>, nodeRegistry?: NodeRegistry | null): ClassDecorator {
  return function (target: Function) {
    // if (!config.type) {
    //   config.type = target.name
    // }

    const metadata = getOrCreateNodeMetadata(target.prototype)
    Object.assign(metadata, config)

    metadata.type = target.name

    if (config.id) {
      metadata.id = config.id
    }

    Reflect.defineMetadata('chaingraph:node-config', metadata, target)
  }
}
