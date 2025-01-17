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
