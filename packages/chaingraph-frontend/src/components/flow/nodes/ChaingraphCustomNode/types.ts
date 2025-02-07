/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Node } from '@xyflow/react'

export type NodeVariant =
  | 'default'
  | 'pink' // For message operations
  | 'blue' // For data operations
  | 'green' // For execution operations
  | 'yellow' // For stream operations
  | 'error'
  | 'success'

export type ChaingraphNodeCustom = Node<{
  title: string
  variant?: NodeVariant
  icon?: string
  inputs?: Array<{
    id: string
    label: string
    type?: 'execute' | 'data' | 'stream'
  }>
  outputs?: Array<{
    id: string
    label: string
    type?: 'execute' | 'data' | 'stream'
  }>
}, 'chaingraphNodeTest'>
