/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

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

        return node.deserialize(nodeData)
      },
    },
    BaseNode.name,
  )
}
