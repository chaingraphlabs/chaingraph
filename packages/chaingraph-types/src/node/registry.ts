import type { ObjectSchema } from '@chaingraph/types/port'
import type { INode } from './interface'
import {
  getOrCreateNodeMetadata,
} from '@chaingraph/types/node/decorator/node-decorator'

export type NodeConstructor = new (...args: any[]) => INode

/**
 * Singleton registry for managing node types
 */
export class NodeRegistry {
  private static instance: NodeRegistry
  private nodes: Map<string, NodeConstructor> = new Map()
  private objectSchema: Map<string, ObjectSchema> = new Map()

  private constructor() {}

  static getInstance(): NodeRegistry {
    if (!NodeRegistry.instance) {
      NodeRegistry.instance = new NodeRegistry()
    }
    return NodeRegistry.instance
  }

  /**
   * Register a node class with its type identifier.
   * @param nodeClass Constructor of the node
   */
  registerNode(nodeClass: NodeConstructor): void {
    const metadata = getOrCreateNodeMetadata(nodeClass)
    if (metadata) {
      this.nodes.set(metadata.type, nodeClass)
    } else {
      throw new Error('Node metadata missing. Ensure @Node decorator is used.')
    }
  }

  /**
   * Create a node instance by type
   * @param type Node type identifier
   * @param args Arguments to pass to the node constructor
   */
  createNode(type: string, ...args: any[]): INode {
    const NodeClass = this.nodes.get(type)
    if (!NodeClass)
      throw new Error(`Unknown node type: ${type}`)

    return new NodeClass(...args)
  }

  /**
   * Get all registered node types
   */
  getNodeTypes(): string[] {
    return Array.from(this.nodes.keys())
  }

  /**
   * Register an object schema
   * @param id Object schema identifier
   * @param schema Object schema
   */
  registerObjectSchema(id: string, schema: ObjectSchema): void {
    this.objectSchema.set(id, schema)
  }

  /**
   * Get the object schema
   * @param id Object schema identifier
   */
  getObjectSchema(id: string): ObjectSchema | undefined {
    return this.objectSchema.get(id)
  }

  /**
   * Get all registered object schemas
   */
  getObjectSchemas(): Map<string, ObjectSchema> {
    return this.objectSchema
  }
}
