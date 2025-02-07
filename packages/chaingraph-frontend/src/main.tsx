import type { INode } from '@badaitech/chaingraph-types'
import type { IPort } from '@badaitech/chaingraph-types/port/base'
import { initializeStores } from '@/store/init.ts'
import { BaseNode, Edge, ExecutionEventImpl, NodeRegistry, registerFlowTransformers } from '@badaitech/chaingraph-types'
import { BasePort } from '@badaitech/chaingraph-types/port/base'
import { MultiChannel } from '@badaitech/chaingraph-types/port/channel'

import { PortFactory } from '@badaitech/chaingraph-types/port/factory'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import superjson from 'superjson'
import App from './App.tsx'
import { RootProvider } from './providers/RootProvider.tsx'
import './index.css'
import './reflect'
import '@badaitech/chaingraph-nodes'

console.log('main.tsx')

// registerNodeTransformers(NodeRegistry.getInstance())
registerFlowTransformers()

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
      port.deserialize(v)
      return port
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

        node.deserialize(nodeData)
        return node
      } catch (e) {
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
        debugger
        throw new Error('Invalid execution event data')
      }
    },
  },
  ExecutionEventImpl.name,
)

initializeStores().catch(console.error)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootProvider>
      <App />
    </RootProvider>
  </StrictMode>,
)
