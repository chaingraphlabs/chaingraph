/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { FlowMetadata } from '@badaitech/chaingraph-types'
import type { ListOrderBy } from '../postgres/store'
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
    const flow = new Flow({
      ...metadata,
      version: metadata.version || 1,
    })
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
  async listFlows(
    ownerId: string,
    orderBy: ListOrderBy,
    limit: number,
  ): Promise<Flow[]> {
    // Convert iterator to array first
    const flowsArray = Array.from(this.flows.values())
      .filter((flow) => {
        if (!flow.metadata.ownerID) {
          return true
        }
        return flow.metadata.ownerID === ownerId
      })

    // Sort based on orderBy parameter
    switch (orderBy) {
      case 'createdAtAsc':
        flowsArray.sort((a, b) =>
          a.metadata.createdAt.getTime() - b.metadata.createdAt.getTime())
        break
      case 'createdAtDesc':
        flowsArray.sort((a, b) =>
          b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime())
        break
      case 'updatedAtAsc':
        flowsArray.sort((a, b) =>
          a.metadata.updatedAt.getTime() - b.metadata.updatedAt.getTime())
        break
      case 'updatedAtDesc':
        flowsArray.sort((a, b) =>
          b.metadata.updatedAt.getTime() - a.metadata.updatedAt.getTime())
        break
      default:
        throw new Error(`Unsupported orderBy value: ${orderBy}`)
    }

    return flowsArray.slice(0, limit)
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
    // get current flow from cache
    const currentFlow = this.flows.get(flow.id)
    if (!currentFlow) {
      throw new Error(`Flow with ID ${flow.id} not found`)
    }

    // update flow metadata
    flow.metadata.version = (currentFlow.metadata.version || 1) + 1

    this.flows.set(flow.id, flow)
    return flow
  }

  /**
   * Checks if user has access to flow
   * @param flowId Flow identifier
   * @param userId User identifier
   * @returns true if user has access, false otherwise
   */
  async hasAccess(flowId: string, userId: string): Promise<boolean> {
    const flow = await this.getFlow(flowId)
    if (!flow) {
      return false
    }

    const hasAccess = !flow.metadata.ownerID || flow.metadata.ownerID === userId
    // TODO: Implement more complex access control logic if needed

    return hasAccess
  }
}
