import type { INode } from '@chaingraph/types'
import type { SerializedFlow } from '@chaingraph/types/flow/types.zod'
import type { JSONValue, SuperJSONResult } from 'superjson/dist/types'
import { Edge, Flow } from '@chaingraph/types'
import superjson from 'superjson'

/**
 * Registers flow transformers with SuperJSON
 */
export function registerFlowTransformers() {
  // Flow
  superjson.registerCustom<Flow, JSONValue>(
    {
      isApplicable: (v): v is Flow => {
        return v instanceof Flow
      },
      serialize: (v) => {
        const serializedEdges = [] as SerializedFlow['edges']
        for (const edge of v.edges.values()) {
          serializedEdges.push({
            id: edge.id,
            metadata: edge.metadata,
            status: edge.status,
            sourceNodeId: edge.sourceNode.id,
            sourcePortId: edge.sourcePort.config.id,
            targetNodeId: edge.targetNode.id,
            targetPortId: edge.targetPort.config.id,
          })
        }

        const serializedFlow: SerializedFlow = {
          id: v.id,
          metadata: v.metadata,
          nodes: Array.from(v.nodes.values()),
          edges: serializedEdges,
        }

        return superjson.serialize(serializedFlow) as unknown as JSONValue
      },
      deserialize: (v) => {
        const flowData = superjson.deserialize<SerializedFlow>(
          v as any as SuperJSONResult,
        )

        const flow = new Flow(flowData.metadata)

        for (const node of flowData.nodes) {
          flow.addNode(node as INode)
        }

        for (const edgeData of flowData.edges) {
          const sourceNode = flow.nodes.get(edgeData.sourceNodeId)
          const targetNode = flow.nodes.get(edgeData.targetNodeId)

          if (!sourceNode) {
            throw new Error(`Source node with ID ${edgeData.sourceNodeId} does not exist.`)
          }
          if (!targetNode) {
            throw new Error(`Target node with ID ${edgeData.targetNodeId} does not exist.`)
          }

          const sourcePort = sourceNode.getPort(edgeData.sourcePortId)
          const targetPort = targetNode.getPort(edgeData.targetPortId)

          if (!sourcePort) {
            throw new Error(
              `Source port with ID ${edgeData.sourcePortId} does not exist on node ${edgeData.sourceNodeId}.`,
            )
          }

          if (!targetPort) {
            throw new Error(
              `Target port with ID ${edgeData.targetPortId} does not exist on node ${edgeData.targetNodeId}.`,
            )
          }

          const edge = new Edge(
            edgeData.id,
            sourceNode,
            sourcePort,
            targetNode,
            targetPort,
            edgeData.metadata,
          )

          flow.addEdge(edge)
        }

        return flow
      },
    },
    Flow.name,
  )
}
