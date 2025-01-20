import type { IEdge, INode } from '@chaingraph/types'
import type { JSONValue, SuperJSONResult } from 'superjson/dist/types'
import { Edge } from '@chaingraph/types'
import superjson from 'superjson'

/**
 * Registers edge transformers with superjson
 */
export function registerEdgeTransformers() {
  const edge = new Edge('', {} as INode, {} as any, {} as INode, {} as any, {})

  superjson.registerCustom<IEdge, JSONValue>(
    {
      isApplicable: (v): v is IEdge => {
        return v instanceof edge.constructor
      },
      serialize: (v) => {
        return superjson.serialize({
          id: v.id,
          status: v.status,
          metadata: v.metadata,
          sourceNode: v.sourceNode,
          sourcePort: v.sourcePort,
          targetNode: v.targetNode,
          targetPort: v.targetPort,
        }) as unknown as JSONValue
      },
      deserialize: (v) => {
        const edgeData = superjson.deserialize(
          v as any as SuperJSONResult,
        ) as any

        // todo: validate edgeData

        const edge = new Edge(
          edgeData.id,
          edgeData.sourceNode,
          edgeData.sourcePort,
          edgeData.targetNode,
          edgeData.targetPort,
          edgeData.metadata,
        )

        return edge
      },
    },
    'IEdge',
  )
}
