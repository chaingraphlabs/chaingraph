// import type { Connection, EdgeChange, NodeChange } from '@xyflow/react'
// import { useCallback } from 'react'
//
// /**
//  * Hook to handle flow interaction callbacks
//  */
// export function useFlowCallbacks() {
//   // const { flow } = useFlow()
//
//   const onNodesChange = useCallback((changes: NodeChange[]) => {
//     // Handle node changes (position, selection, etc)
//     changes.forEach((change) => {
//       if (change.type === 'position' && change.position && flow) {
//         const node = flow.nodes.get(change.id)
//         if (node) {
//           node.setPosition(change.position)
//         }
//       }
//     })
//   }, [flow])
//
//   const onEdgesChange = useCallback((changes: EdgeChange[]) => {
//     // Handle edge changes (removal, selection)
//     changes.forEach((change) => {
//       if (change.type === 'remove' && flow) {
//         flow.removeEdge(change.id)
//       }
//     })
//   }, [flow])
//
//   const onConnect = useCallback(async (connection: Connection) => {
//     if (!flow || !connection.source || !connection.target)
//       return
//
//     // Connect ports
//     await flow.connectPorts(
//       connection.source,
//       connection.sourceHandle!,
//       connection.target,
//       connection.targetHandle!,
//     )
//   }, [flow])
//
//   return {
//     onNodesChange,
//     onEdgesChange,
//     onConnect,
//   }
// }
