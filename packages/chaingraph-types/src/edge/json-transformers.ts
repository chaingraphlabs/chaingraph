/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '../node'
import type { IPort } from '../port'
import SuperJSON from 'superjson'
import { getTransformerTraceCallbacks } from '../json-transformers-trace'
import { Edge } from './edge'

/**
 * Registers edge transformers with superjson
 */
export function registerEdgeTransformers(
  superjsonCustom: typeof SuperJSON = SuperJSON,
) {
  superjsonCustom.registerCustom<Edge, any>(
    {
      isApplicable: (v): v is Edge => {
        return v instanceof Edge
      },
      serialize: (v) => {
        return superjsonCustom.serialize({
          id: v.id,
          status: v.status,
          metadata: v.metadata,
          sourceNode: superjsonCustom.serialize(v.sourceNode),
          sourcePort: superjsonCustom.serialize(v.sourcePort),
          targetNode: superjsonCustom.serialize(v.targetNode),
          targetPort: superjsonCustom.serialize(v.targetPort),
        })
      },
      deserialize: (v) => {
        const traceCallbacks = getTransformerTraceCallbacks()
        const spanId = traceCallbacks?.onDeserializeStart?.('Edge')

        const edgeData = superjsonCustom.deserialize(
          v as any,
        ) as any

        const sourceNode = superjsonCustom.deserialize<INode>(edgeData.sourceNode)
        const sourcePort = superjsonCustom.deserialize<IPort>(edgeData.sourcePort)
        const targetNode = superjsonCustom.deserialize<INode>(edgeData.targetNode)
        const targetPort = superjsonCustom.deserialize<IPort>(edgeData.targetPort)

        // todo: validate edgeData
        const edge = new Edge(
          edgeData.id,
          sourceNode,
          sourcePort,
          targetNode,
          targetPort,
          edgeData.metadata,
        )

        traceCallbacks?.onDeserializeEnd?.(spanId ?? null)
        return edge
      },
    },
    'Edge',
  )
}
