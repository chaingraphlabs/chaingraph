import type { CategoryMetadata, INode } from '@badaitech/chaingraph-types'
import type { Node } from '@xyflow/react'

export type GroupNode = Node<{
  node: INode
  categoryMetadata: CategoryMetadata
}, 'groupNode'>
