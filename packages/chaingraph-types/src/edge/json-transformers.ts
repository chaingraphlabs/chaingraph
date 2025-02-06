// import type { JSONValue, SuperJSONResult } from 'superjson/dist/types'
import type { JSONValue } from '@chaingraph/types'
import type { SuperJSONResult } from 'superjson'
import { Edge } from '@chaingraph/types'
import superjson from 'superjson'

/**
 * Registers edge transformers with superjson
 */
export function registerEdgeTransformers() {
  // const edge = new Edge('', {} as INode, {} as any, {} as INode, {} as any, {})

  superjson.registerCustom<Edge, JSONValue>(
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
        }) as unknown as JSONValue
      },
      deserialize: (v) => {
        const edgeData = superjson.deserialize(
          v as any as SuperJSONResult,
        ) as any

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
    Edge.name,
  )
}
