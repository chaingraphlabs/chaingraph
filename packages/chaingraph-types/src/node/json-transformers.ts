import type { INode, PortConfig, PortValue } from '@chaingraph/types'
import type { JSONValue, SuperJSONResult } from 'superjson/dist/types'
import { getOrCreateNodeMetadata, NodeRegistry, SerializedNodeSchema } from '@chaingraph/types'
import { parsePortConfig } from '@chaingraph/types/port/types/port-config-parsing.zod'
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
          const portsValues = new Map<string, PortValue>()
          for (const [portId, port] of v.ports.entries()) {
            portsValues.set(portId, port.getValue())
          }

          // serialize only ports values instead of all ports
          // for better performance and smaller payload
          return superjson.serialize({
            id: v.id,
            metadata: v.metadata,
            status: v.status,
            portsValues,
          }) as unknown as JSONValue
        },
        deserialize: (v) => {
          const nodeData = superjson.deserialize<INode>(v as any as SuperJSONResult)

          const nodeDataParsed = SerializedNodeSchema.parse({
            id: nodeData.id,
            metadata: nodeData.metadata,
            status: nodeData.status,
          })

          const node = nodeRegistry.createNode(
            nodeDataParsed.metadata.type,
            nodeDataParsed.id,
            nodeDataParsed.metadata,
          )

          const portsConfig = new Map<string, PortConfig>()
          for (const [portId, portConfig] of nodeData.metadata?.portsConfig?.entries() || []) {
            portsConfig.set(portId, parsePortConfig(portConfig))
          }

          node.setMetadata({ ...node.metadata, portsConfig })
          node.disableEvents()
          node.initialize()
          node.setStatus((nodeData as any).status)
          node.enableEvents()

          // set ports values
          const portsValues = (nodeData as any).portsValues.entries()
          portsValues.forEach(([portId, portValue]: any) => {
            const port = node.getPort(portId)
            port?.setValue(portValue)
          })

          // const ports = (nodeData as any).ports.entries()
          // ports.forEach(([portId, portData]: any) => {
          //   // validate port config
          //   const config = parsePortConfig(portData.config)
          //   const value = PortValueSchema.parse(portData.value)
          //   const port = PortFactory.create(config)
          //   port.setValue(value)
          //
          //   node.addPort(port)
          // })

          return node as INode
        },
      },
      nodeInstance.metadata.type,
    )
  })
//
//   superjson.registerCustom<CategorizedNodes, JSONValue>(
//     {
//       isApplicable: (v): v is CategorizedNodes => {
//         return (v as any).category && (v as any).metadata && isKnownCategory((v as any).category)
//       },
//       serialize: (v) => {
//         // serialize only ports values instead of all ports
//         // for better performance and smaller payload
//         return superjson.serialize({
//           category: v.category,
//           metadata: v.metadata,
//           nodes: v.nodes,
//         }) as unknown as JSONValue
//       },
//       deserialize: (v) => {
//         return superjson.deserialize(v) as unknown as CategorizedNodes
//       },
//     },
//     'CategorizedNodes',
//   )
}
