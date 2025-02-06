import type { JSONValue } from '@chaingraph/types'
import type { SerializedFlow } from '@chaingraph/types/flow/types.zod'
import type { IPort } from '@chaingraph/types/port/base'
import type { SuperJSONResult } from 'superjson'
import { Edge, ExecutionEventImpl, Flow, NodeRegistry } from '@chaingraph/types'
import { registerEdgeTransformers } from '@chaingraph/types/edge/json-transformers'
import { BasePort } from '@chaingraph/types/port/base'
import { PortFactory } from '@chaingraph/types/port/factory'
import SuperJSON from 'superjson'

/**
 * Registers flow transformers with SuperJSON
 */
export function registerFlowTransformers() {
  SuperJSON.registerCustom<IPort, JSONValue>(
    {
      isApplicable: (v): v is IPort => {
        return v instanceof BasePort
      },
      serialize: (v) => {
        return v.serialize() as unknown as JSONValue
      },
      deserialize: (v) => {
        const port = PortFactory.createFromConfig((v as any).config)
        port.deserialize(v)
        return port
      },
    },
    BasePort.name,
  )

  // Flow
  SuperJSON.registerCustom<Flow, JSONValue>(
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
            sourcePortId: edge.sourcePort.id!,
            targetNodeId: edge.targetNode.id,
            targetPortId: edge.targetPort.id!,
          })
        }

        const nodes: SerializedFlow['nodes'] = []
        if (v.nodes) {
          for (const node of v.nodes.values()) {
            nodes.push(node.serialize() as any)
          }
        }

        const serializedFlow: SerializedFlow = {
          id: v.id,
          metadata: v.metadata,
          nodes,
          edges: serializedEdges,
        }

        return SuperJSON.serialize(serializedFlow) as unknown as JSONValue
      },
      deserialize: (v) => {
        const flowData = SuperJSON.deserialize<SerializedFlow>(
          v as any as SuperJSONResult,
        )

        const flow = new Flow(flowData.metadata)

        for (const nodeData of flowData.nodes) {
          const nodeMetadata = nodeData.metadata as any

          const node = NodeRegistry.getInstance().createNode(
            nodeMetadata.type,
            nodeData.id ?? nodeMetadata.id ?? '',
            nodeMetadata,
          )
          node.deserialize(nodeData)

          flow.addNode(node)
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

  // Execution event data
  SuperJSON.registerCustom<ExecutionEventImpl, JSONValue>(
    {
      isApplicable: (v): v is ExecutionEventImpl<any> => {
        return v instanceof ExecutionEventImpl
      },
      serialize: (v) => {
        return SuperJSON.serialize({
          index: v.index,
          type: v.type,
          timestamp: v.timestamp,
          data: SuperJSON.serialize(v.data),
        }) as unknown as JSONValue
      },
      deserialize: (v) => {
        const eventData = SuperJSON.deserialize(v as any) as any

        if (!eventData) {
          throw new Error('Invalid execution event data')
        }

        const data = SuperJSON.deserialize(eventData.data)

        return new ExecutionEventImpl(
          eventData.index,
          eventData.type,
          eventData.timestamp,
          data,
        )
      },
    },
    ExecutionEventImpl.name,
  )

  registerEdgeTransformers()
}
