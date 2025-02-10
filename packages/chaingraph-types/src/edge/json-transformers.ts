/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import superjson from 'superjson'
import { Edge } from './edge'

/**
 * Registers edge transformers with superjson
 */
export function registerEdgeTransformers() {
  // const edge = new Edge('', {} as INode, {} as any, {} as INode, {} as any, {})

  superjson.registerCustom<Edge, any>(
    {
      isApplicable: (v): v is Edge => {
        return v instanceof Edge
      },
      serialize: (v) => {
        return superjson.serialize({
          id: v.id,
          status: v.status,
          metadata: v.metadata,
          // TODO:!!!!
          sourceNode: superjson.serialize(v.sourceNode),
          sourcePort: superjson.serialize(v.sourcePort),
          targetNode: superjson.serialize(v.targetNode),
          targetPort: superjson.serialize(v.targetPort),
        })
      },
      deserialize: (v) => {
        const edgeData = superjson.deserialize(v) as any

        // todo: validate edgeData
        return new Edge(
          edgeData.id,
          superjson.deserialize(edgeData.sourceNode),
          superjson.deserialize(edgeData.sourcePort),
          superjson.deserialize(edgeData.targetNode),
          superjson.deserialize(edgeData.targetPort),
          edgeData.metadata,
        )
      },
    },
    'Edge',
  )
}
