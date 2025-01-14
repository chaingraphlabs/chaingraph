import type { Flow, FlowMetadata, INode } from '@chaingraph/types'

/**
 * Interface for flow storage implementations
 */
export interface IFlowStore {
  createFlow: (metadata: FlowMetadata) => Promise<Flow>
  getFlow: (flowId: string) => Promise<Flow | null>
  listFlows: () => Promise<Flow[]>
  addNode: (flowId: string, node: INode) => Promise<void>
  listFlowNodes: (flowId: string) => Promise<INode[]>
  deleteFlow: (flowId: string) => Promise<boolean>
}
