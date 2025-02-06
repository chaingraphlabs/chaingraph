import type { INode } from '@chaingraph/types'
import type { JSONValue } from 'superjson/dist/types'
import {
  NodeRegistry,
} from '@chaingraph/types'
import {
  getOrCreateNodeMetadata,
} from '@chaingraph/types/node/decorator-new/getOrCreateNodeMetadata'
import superjson from 'superjson'

/**
 * Registers node transformers with SuperJSON
 */
export function registerNodeTransformers(nodeRegistry?: NodeRegistry): void {
  // Register base node transformer
  if (nodeRegistry === undefined) {
    nodeRegistry = NodeRegistry.getInstance()
  }

  nodeRegistry.getNodeTypes().forEach((nodeType) => {
    const nodeInstance = nodeRegistry.createNode(nodeType, '')

    const metadata = getOrCreateNodeMetadata(nodeInstance)
    if ((metadata as any)?.category === '__OBJECT_SCHEMA__') {
      return
    }

    superjson.registerCustom<INode, JSONValue>(
      {
        isApplicable: (v): v is INode => {
          return v instanceof nodeInstance.constructor
        },
        serialize: (v) => {
          return v.serialize() as unknown as JSONValue
        },
        deserialize: (v) => {
          const nodeData = v as any
          const nodeMetadata = nodeData.metadata as any

          const node = nodeRegistry.createNode(
            nodeMetadata.metadata.type,
            nodeMetadata.id,
            nodeMetadata.metadata,
          )

          node.deserialize(nodeData)

          return node
        },
      },
      nodeInstance.metadata.type,
    )
  })
}
