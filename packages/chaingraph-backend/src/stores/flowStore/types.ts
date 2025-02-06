import type { Flow, FlowMetadata, INode } from '@badaitech/chaingraph-types'

/**
 * Interface for flow storage implementations
 */
export interface IFlowStore {
  createFlow: (metadata: FlowMetadata) => Promise<Flow>
  getFlow: (flowId: string) => Promise<Flow | null>
  listFlows: () => Promise<Flow[]>
  addNode: (flowId: string, node: INode) => Promise<INode>
  listFlowNodes: (flowId: string) => Promise<INode[]>
  deleteFlow: (flowId: string) => Promise<boolean>
  updateFlow: (flowId: string, flow: Flow) => Promise<Flow>
}
