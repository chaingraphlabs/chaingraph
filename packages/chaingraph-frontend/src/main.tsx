import type { INode, JSONValue } from '@chaingraph/types'
import type { IPort } from '@chaingraph/types/port/base'
import { initializeStores } from '@/store/init.ts'
import { nodeRegistry } from '@chaingraph/nodes'
import { Edge, registerFlowTransformers, registerNodeTransformers } from '@chaingraph/types'
import { BasePort } from '@chaingraph/types/port/base'
import { MultiChannel } from '@chaingraph/types/port/channel'
import { PortFactory } from '@chaingraph/types/port/factory'
import {
  ArrayPortPlugin,
  EnumPortPlugin,
  NumberPortPlugin,
  ObjectPortPlugin,
  StreamPortPlugin,
  StringPortPlugin,
} from '@chaingraph/types/port/plugins'
import { portRegistry } from '@chaingraph/types/port/registry/PortPluginRegistry.ts'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import superjson from 'superjson'
import App from './App.tsx'
import { RootProvider } from './providers/RootProvider.tsx'
import './index.css'
import './reflect'

console.log('main.tsx')

portRegistry.register(StringPortPlugin)
portRegistry.register(NumberPortPlugin)
portRegistry.register(ArrayPortPlugin)
portRegistry.register(ObjectPortPlugin)
portRegistry.register(EnumPortPlugin)
portRegistry.register(StreamPortPlugin)

registerNodeTransformers(nodeRegistry)
registerFlowTransformers()

superjson.registerCustom<IPort, JSONValue>(
  {
    isApplicable: (v): v is IPort => {
      debugger
      return v instanceof BasePort
    },
    serialize: (v) => {
      debugger
      return v.serialize() as unknown as JSONValue
    },
    deserialize: (v) => {
      debugger
      const port = PortFactory.createFromConfig((v as any).config)
      port.deserialize(v)
      return port
    },
  },
  BasePort.name,
)

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
        sourceNode: superjson.serialize(v.sourceNode),
        sourcePort: superjson.serialize(v.sourcePort),
        targetNode: superjson.serialize(v.targetNode),
        targetPort: superjson.serialize(v.targetPort),
      }) as unknown as JSONValue
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

superjson.registerCustom<MultiChannel<any>, JSONValue>(
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

initializeStores().catch(console.error)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootProvider>
      <App />
    </RootProvider>
  </StrictMode>,
)
