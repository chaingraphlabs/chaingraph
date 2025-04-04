/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { FlowMetadata } from '@badaitech/chaingraph-types'
import type { IFlowStore } from './types'
import { Flow } from '@badaitech/chaingraph-types'

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
   * Deletes flow
   * @param flowId Flow identifier
   * @returns true if flow was deleted, false if not found
   */
  async deleteFlow(flowId: string): Promise<boolean> {
    return this.flows.delete(flowId)
  }

  /**
   * Updates flow with new data
   * @param flow Flow data
   * @returns Updated flow
   */
  async updateFlow(flow: Flow): Promise<Flow> {
    this.flows.set(flow.id, flow)
    return flow
  }
}
