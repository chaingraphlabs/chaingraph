import type { INode, IPort, JSONValue } from '@chaingraph/types'
import { initializeStores } from '@/store/init.ts'
import { nodeRegistry } from '@chaingraph/nodes'
import {
  Edge,
  registerFlowTransformers,
  registerNodeTransformers,
  registerPortTransformers,
} from '@chaingraph/types'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import superjson from 'superjson'
import App from './App.tsx'
import { RootProvider } from './providers/RootProvider.tsx'
import './index.css'
import './reflect'

registerPortTransformers()
registerNodeTransformers(nodeRegistry)
registerFlowTransformers()

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

// Execution event data
// SuperJSON.registerCustom<ExecutionEventImpl, JSONValue>(
//   {
//     isApplicable: (v): v is ExecutionEventImpl<any> => {
//       return v instanceof ExecutionEventImpl
//     },
//     serialize: (v) => {
//       return SuperJSON.serialize({
//         index: v.index,
//         type: v.type,
//         timestamp: v.timestamp,
//         data: SuperJSON.serialize(v.data),
//       }) as unknown as JSONValue
//     },
//     deserialize: (v) => {
//       debugger
//       const eventData = SuperJSON.deserialize(v as any) as any
//
//       if (!eventData) {
//         throw new Error('Invalid execution event data')
//       }
//
//       const data = SuperJSON.deserialize(eventData.data)
//
//       console.log('!!!!!!!!!Deserializing execution event:', data)
//
//       return new ExecutionEventImpl(
//         eventData.index,
//         eventData.type,
//         eventData.timestamp,
//         data,
//       )
//     },
//   },
//   ExecutionEventImpl.name,
// )

initializeStores().catch(console.error)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootProvider>
      <App />
    </RootProvider>
  </StrictMode>,
)
