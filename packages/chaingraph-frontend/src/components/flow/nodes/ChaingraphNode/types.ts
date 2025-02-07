import type { CategoryMetadata, INode } from '@badaitech/chaingraph-types'
import type { Node } from '@xyflow/react'

// export type ChaingraphNode = Node<{
//   node: INode
//   categoryMetadata: CategoryMetadata
// }, 'chaingraphNode'>

// interface BaseChaingraphNodeData {
//   node: INode
//   categoryMetadata: CategoryMetadata
// }

// Extended interface with index signature
// export type ChaingraphNodeData = BaseChaingraphNodeData & {
//   [key: string]: unknown
// }

export type ChaingraphNode = Node<{
  node: INode
  categoryMetadata: CategoryMetadata
}, 'chaingraphNode'>
