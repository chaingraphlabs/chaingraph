/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

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
