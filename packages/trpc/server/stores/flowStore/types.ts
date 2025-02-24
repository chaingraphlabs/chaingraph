/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Flow, FlowMetadata } from '@badaitech/chaingraph-types'

/**
 * Interface for flow storage implementations
 */
export interface IFlowStore {
  createFlow: (metadata: FlowMetadata) => Promise<Flow>
  getFlow: (flowId: string) => Promise<Flow | null>
  listFlows: () => Promise<Flow[]>
  deleteFlow: (flowId: string) => Promise<boolean>
  updateFlow: (flow: Flow) => Promise<Flow>
}
