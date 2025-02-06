import type { CategoryMetadata, INode, IPort, PortConfig, PortKind } from '@chaingraph/types'
import type { Node, NodeTypes } from '@xyflow/react'
import type { ReactNode } from 'react'
import { StringInputPort } from './ports/StringPort/StringInputPort'
import { StringOutputPort } from './ports/StringPort/StringOutputPort'

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
