import type { NodeConstructor, NodeMetadata } from '@badaitech/chaingraph-types/node'
import { getNodeMetadata, getOrCreateNodeMetadata, NodeRegistry, setNodeMetadata } from '@badaitech/chaingraph-types/node'

import 'reflect-metadata'

/**
 * Node decorator that stores node metadata.
 * It uses the already existing NodeMetadata type.
 */
export function Node(config: Omit<NodeMetadata, 'type'>, nodeRegistry?: NodeRegistry | null): ClassDecorator {
  return function (target: Function) {
    const metadata = getOrCreateNodeMetadata(target.prototype)
    Object.assign(metadata, config)

    metadata.type = target.name

    if (config.id) {
      metadata.id = config.id
    }

    setNodeMetadata(target, metadata)

    const checkMeta = getNodeMetadata(target)

    if (nodeRegistry) {
      nodeRegistry.registerNode(target as NodeConstructor)
    } else {
      NodeRegistry.getInstance().registerNode(target as NodeConstructor)
    }
  }
}
