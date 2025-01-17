import type { IFlowStore } from '@chaingraph/backend/stores/flowStore/types'
import type { FlowMetadata, INode } from '@chaingraph/types'
import { Flow } from '@chaingraph/types'

/**
 * In-memory implementation of flow storage
 */
export class InMemoryFlowStore implements IFlowStore {
  private flows: Map<string, Flow> = new Map()

  /**
   * Creates a new flow with given metadata
   * @param metadata Flow metadata
   * @returns Created flow ID
   */
  async createFlow(metadata: FlowMetadata): Promise<Flow> {
    const flow = new Flow(metadata)
    this.flows.set(flow.id, flow)
    return flow
  }

  /**
   * Retrieves flow by ID
   * @param flowId Flow identifier
   * @returns Flow instance or null if not found
   */
  async getFlow(flowId: string): Promise<Flow | null> {
    return this.flows.get(flowId) || null
  }

  /**
   * Lists all available flows
   * @returns Array of flows
   */
  async listFlows(): Promise<Flow[]> {
    return Array.from(this.flows.values())
  }

  /**
   * Adds a node to specified flow
   * @param flowId Flow identifier
   * @param node Node to add
   * @throws Error if flow not found
   */
  async addNode(flowId: string, node: INode): Promise<void> {
    const flow = this.flows.get(flowId)
    if (!flow) {
      throw new Error(`Flow ${flowId} not found`)
    }
    flow.addNode(node)
  }

  /**
   * Lists all nodes in a flow
   * @param flowId Flow identifier
   * @returns Array of nodes or empty array if flow not found
   */
  async listFlowNodes(flowId: string): Promise<INode[]> {
    const flow = this.flows.get(flowId)
    return flow ? Array.from(flow.nodes.values()) : []
  }

  /**
   * Deletes flow
   * @param flowId Flow identifier
   * @returns true if flow was deleted, false if not found
   */
  async deleteFlow(flowId: string): Promise<boolean> {
    return this.flows.delete(flowId)
  }

  /**
   * Updates flow with new data
   * @param flowId Flow identifier
   * @param flow Flow data
   * @returns Updated flow
   */
  async updateFlow(flowId: string, flow: Flow): Promise<Flow> {
    this.flows.set(flowId, flow)
    return flow
  }
}
