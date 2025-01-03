import type { INode } from './interface'
import type { NodeMetadata } from './types'

/**
 * Node constructor type
 */
export type NodeConstructor = new () => INode

/**
 * Node factory function type
 */
export type NodeFactory = (metadata: NodeMetadata) => Promise<INode>

/**
 * Node registration information
 */
export interface NodeRegistration {
  /** Node metadata */
  metadata: NodeMetadata

  /** Node factory function */
  factory: NodeFactory

  /** Optional validation function */
  validate?: (node: INode) => Promise<boolean>
}
