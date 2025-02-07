/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

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
