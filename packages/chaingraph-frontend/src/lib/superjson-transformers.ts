import type { INode, SerializedFlow } from '@badaitech/chaingraph-types'
import type { IPort } from '@badaitech/chaingraph-types/port/base'
import { BaseNode, Edge, ExecutionEventImpl, Flow, NodeRegistry } from '@badaitech/chaingraph-types'
import { BasePort } from '@badaitech/chaingraph-types/port/base'
import { MultiChannel } from '@badaitech/chaingraph-types/port/channel'

import { PortFactory } from '@badaitech/chaingraph-types/port/factory'
import superjson from 'superjson'

superjson.registerCustom<Flow, any>(
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

      return superjson.serialize(serializedFlow)
    },
    deserialize: (v) => {
      const flowData = superjson.deserialize<SerializedFlow>(v)

      const flow = new Flow(flowData.metadata)

      for (const nodeData of flowData.nodes) {
        const nodeMetadata = nodeData.metadata as any

        const node = NodeRegistry.getInstance().createNode(
          nodeMetadata.type,
          nodeData.id ?? nodeMetadata.id ?? '',
          nodeMetadata,
        ).deserialize(nodeData)

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

superjson.registerCustom<IPort, any>(
  {
    isApplicable: (v): v is IPort => {
      return v instanceof BasePort
    },
    serialize: (v) => {
      return v.serialize()
    },
    deserialize: (v) => {
      const port = PortFactory.createFromConfig((v as any).config)
      return port.deserialize(v)
    },
  },
  BasePort.name,
)

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
        sourceNode: superjson.serialize(v.sourceNode),
        sourcePort: superjson.serialize(v.sourcePort),
        targetNode: superjson.serialize(v.targetNode),
        targetPort: superjson.serialize(v.targetPort),
      })
    },
    deserialize: (v) => {
      const edgeData = superjson.deserialize(
        v as any,
      ) as any

      const sourceNode = superjson.deserialize<INode>(edgeData.sourceNode)
      const sourcePort = superjson.deserialize<IPort>(edgeData.sourcePort)
      const targetNode = superjson.deserialize<INode>(edgeData.targetNode)
      const targetPort = superjson.deserialize<IPort>(edgeData.targetPort)

      // todo: validate edgeData
      const edge = new Edge(
        edgeData.id,
        sourceNode,
        sourcePort,
        targetNode,
        targetPort,
        edgeData.metadata,
      )

      return edge
    },
  },
  Edge.name,
)

superjson.registerCustom<MultiChannel<any>, any>(
  {
    // isApplicable: (v): v is MultiChannel<any> => v instanceof MultiChannel,
    isApplicable: (v): v is MultiChannel<any> => {
      return v instanceof MultiChannel
    },
    serialize: (v) => {
      return v.serialize()
    },
    deserialize: (v) => {
      return MultiChannel.deserialize(v)
    },
  },
  MultiChannel.name,
)

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

      try {
        const node = NodeRegistry.getInstance().createNode(
          nodeMetadata.type,
          nodeData.id ?? nodeMetadata.id ?? '',
          nodeMetadata,
        )

        return node.deserialize(nodeData)
      } catch (e) {
        // eslint-disable-next-line no-debugger
        debugger
        console.error('Error deserializing node:', e)
        throw e
      }
    },
  },
  BaseNode.name,
)

// Execution event data
superjson.registerCustom<ExecutionEventImpl, any>(
  {
    isApplicable: (v): v is ExecutionEventImpl<any> => {
      return v instanceof ExecutionEventImpl
    },
    serialize: (v) => {
      return superjson.serialize({
        index: v.index,
        type: v.type,
        timestamp: v.timestamp,
        data: superjson.serialize(v.data),
      })
    },
    deserialize: (v) => {
      const eventData = superjson.deserialize(v as any) as any

      if (!eventData) {
        throw new Error('Invalid execution event data')
      }

      try {
        const data = superjson.deserialize(eventData.data)

        return new ExecutionEventImpl(
          eventData.index,
          eventData.type,
          eventData.timestamp,
          data,
        )
      } catch (e: any) {
        console.error(e)
        // eslint-disable-next-line no-debugger
        debugger
        throw new Error('Invalid execution event data')
      }
    },
  },
  ExecutionEventImpl.name,
)
