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
import { processPortConfig } from './decorator/instance-converter'

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
          // Process ports and their configurations
          const ports = new Map<string, SerializedPortData>()
          for (const [portId, port] of v.ports.entries()) {
            // Process the port configuration to convert any class instances
            const processedConfig = processPortConfig(port.config)
            // Create a new port with the processed config
            const processedPort = PortFactory.create(processedConfig)
            processedPort.setValue(port.getValue())
            // Serialize the processed port
            ports.set(portId, processedPort.serialize())
          }

          // Process portsConfig in metadata
          const processedPortsConfig = new Map<string, PortConfig>()
          for (const [key, config] of v.metadata.portsConfig?.entries() || []) {
            processedPortsConfig.set(key, processPortConfig(config))
          }

          // Convert portsConfig Map to array of entries for serialization
          const portsConfigEntries = Array.from(processedPortsConfig.entries())

          return superjson.serialize({
            id: v.id,
            metadata: {
              ...v.metadata,
              portsConfig: portsConfigEntries,
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
