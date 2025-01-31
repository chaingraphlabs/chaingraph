import type { INode } from '@chaingraph/types'
import type { IPortAny, PortConfig, SerializedPortData } from '@chaingraph/types/port.new'
import type { JSONValue, SuperJSONResult } from 'superjson/dist/types'
import {
  getOrCreateNodeMetadata,
  NodeRegistry,
  SerializedNodeSchema,
} from '@chaingraph/types'
import { PortFactory } from '@chaingraph/types/port.new'
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
          const ports = new Map<string, SerializedPortData>()
          for (const [portId, port] of v.ports.entries()) {
            ports.set(portId, port.serialize())
          }

          // Convert portsConfig Map to array of entries for serialization
          const portsConfigEntries = Array.from(v.metadata.portsConfig?.entries() || [])

          return superjson.serialize({
            id: v.id,
            metadata: {
              ...v.metadata,
              portsConfig: portsConfigEntries, // Serialize as array of entries
            },
            status: v.status,
            ports,
          }) as unknown as JSONValue
        },
        deserialize: (v) => {
          const nodeData = superjson.deserialize(v as any as SuperJSONResult) as any

          // Convert portsConfig entries back to Map
          const portsConfigEntries = nodeData.metadata.portsConfig || []
          const portsConfig = new Map(portsConfigEntries)

          const metadata = {
            ...nodeData.metadata,
            portsConfig,
          }

          const nodeDataParsed = SerializedNodeSchema.parse({
            id: nodeData.id,
            metadata,
            status: nodeData.status,
          })

          const node = nodeRegistry.createNode(
            nodeDataParsed.metadata.type,
            nodeDataParsed.id,
            nodeDataParsed.metadata,
          )

          const ports = new Map<string, IPortAny>()
          const serializedPorts = nodeData.ports as Map<string, SerializedPortData>
          for (const [portId, serializedPort] of serializedPorts.entries()) {
            const port = PortFactory
              .create(serializedPort.config)
              .deserialize(serializedPort)

            ports.set(portId, port)
          }

          node.setPorts(ports)
          node.setStatus((nodeData as any).status, false)

          return node as INode
        },
      },
      nodeInstance.metadata.type,
    )
  })
}
