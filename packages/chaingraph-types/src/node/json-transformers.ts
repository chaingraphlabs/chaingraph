import type { INode } from '@badaitech/chaingraph-types'
import { BaseNode, NodeRegistry } from '@badaitech/chaingraph-types'

import superjson from 'superjson'

/**
 * Registers node transformers with SuperJSON
 */
export function registerNodeTransformers(nodeRegistry?: NodeRegistry): void {
  // Register base node transformer
  if (nodeRegistry === undefined) {
    nodeRegistry = NodeRegistry.getInstance()
  }

  superjson.registerCustom<INode, any>(
    {
      isApplicable: (v): v is INode => {
        return v instanceof BaseNode
      },
      serialize: (v) => {
        return v.serialize()
      },
      deserialize: (v) => {
        const nodeData = v as any
        const nodeMetadata = nodeData.metadata as any

        const node = nodeRegistry.createNode(
          nodeMetadata.type,
          nodeData.id ?? nodeMetadata.id ?? '',
          nodeMetadata,
        )

        node.deserialize(nodeData)

        return node
      },
    },
    BaseNode.name,
  )
}
