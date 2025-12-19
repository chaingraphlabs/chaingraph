/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from './interface'
import SuperJSON from 'superjson'
import { BaseNode, NodeRegistry } from '..'
import { getTransformerTraceCallbacks } from '../json-transformers-trace'

/**
 * Registers node transformers with SuperJSON
 */
export function registerNodeTransformers(
  nodeRegistry?: NodeRegistry,
  superjsonCustom: typeof SuperJSON = SuperJSON,
): void {
  // Register base node transformer
  if (nodeRegistry === undefined) {
    nodeRegistry = NodeRegistry.getInstance()
  }

  superjsonCustom.registerCustom<INode, any>(
    {
      isApplicable: (v): v is INode => {
        return v instanceof BaseNode
      },
      serialize: (v) => {
        return v.serialize()
      },
      deserialize: (v) => {
        const traceCallbacks = getTransformerTraceCallbacks()
        const spanId = traceCallbacks?.onDeserializeStart?.('BaseNode')

        const nodeData = v as any
        const nodeMetadata = nodeData.metadata as any

        try {
          const node = nodeRegistry.createNode(
            nodeMetadata.type,
            nodeData.id ?? nodeMetadata.id ?? '',
            nodeMetadata,
          )

          const result = node.deserialize(nodeData)
          traceCallbacks?.onDeserializeEnd?.(spanId ?? null)
          return result
        } catch (err: any) {
          traceCallbacks?.onDeserializeEnd?.(spanId ?? null)
          console.error('Failed to deserialize node', err, nodeRegistry)
          throw err
        }
      },
    },
    'BaseNode',
  )
}
