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
  // Map to store flows in memory
  private flows: Map<string, Flow> = new Map()

  // Map to manage locks and wait queues
  private lockQueues: Map<string, {
    locked: boolean
    waitQueue: Array<{ resolve: () => void, reject: (error: Error) => void }>
  }> = new Map()

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
   * Retrieves flow metadata by ID
   * @param flowId Flow identifier
   * @returns Flow metadata
   * @throws Error if flow not found
   */
  async getFlowMetadata(flowId: string): Promise<FlowMetadata> {
    const flow = this.flows.get(flowId)
    if (!flow) {
      throw new Error(`Flow with ID ${flowId} not found`)
    }
    return flow.metadata
  }

  /**
   * Lists all available flows
   * @returns Array of flows
   */
  async listFlows(
    ownerId: string,
    orderBy: ListOrderBy,
    limit: number,
  ): Promise<FlowMetadata[]> {
    // Convert iterator to array first
    const flowsArray = Array.from(this.flows.values())
      .map((flow) => {
        return flow.metadata
      })
      .filter((flow) => {
        if (!flow.ownerID) {
          return true
        }
        return flow.ownerID === ownerId
      })

    // Sort based on orderBy parameter
    switch (orderBy) {
      case 'createdAtAsc':
        flowsArray.sort((a, b) =>
          a.createdAt.getTime() - b.createdAt.getTime())
        break
      case 'createdAtDesc':
        flowsArray.sort((a, b) =>
          b.createdAt.getTime() - a.createdAt.getTime())
        break
      case 'updatedAtAsc':
        flowsArray.sort((a, b) =>
          a.updatedAt.getTime() - b.updatedAt.getTime())
        break
      case 'updatedAtDesc':
        flowsArray.sort((a, b) =>
          b.updatedAt.getTime() - a.updatedAt.getTime())
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

  /**
   * Locks a flow to prevent concurrent modifications.
   * If the flow is already locked, this method will block until the lock is released.
   * @param flowId Flow identifier
   * @param timeout Lock timeout in milliseconds (default: 5000 ms)
   * @throws Error if flow doesn't exist
   */
  async lockFlow(flowId: string, timeout = 5000): Promise<void> {
    // Check if flow exists
    const flow = await this.getFlow(flowId)
    if (!flow) {
      throw new Error(`Flow with ID ${flowId} not found`)
    }

    // Initialize lock queue if needed
    if (!this.lockQueues.has(flowId)) {
      this.lockQueues.set(flowId, {
        locked: false,
        waitQueue: [],
      })
    }

    const lockInfo = this.lockQueues.get(flowId)!

    // If already locked, wait in the queue
    if (lockInfo.locked) {
      await new Promise<void>((resolve, reject) => {
        lockInfo.waitQueue.push({ resolve, reject })
      })
    }

    // Mark as locked
    lockInfo.locked = true

    // Setup timeout if needed
    if (timeout > 0) {
      setTimeout(() => {
        this.unlockFlow(flowId).catch(console.error)
      }, timeout)
    }
  }

  /**
   * Unlocks a previously locked flow and grants lock to the next waiter if any
   * @param flowId Flow identifier
   * @throws Error if flow doesn't exist
   */
  async unlockFlow(flowId: string): Promise<void> {
    // Check if flow exists

    const lockInfo = this.lockQueues.get(flowId)
    if (!lockInfo)
      return // No lock to release

    // If there are waiters, give the lock to the next one
    if (lockInfo.waitQueue.length > 0) {
      const nextWaiter = lockInfo.waitQueue.shift()!
      nextWaiter.resolve()
    } else {
      // No waiters, just mark as unlocked
      lockInfo.locked = false
    }
  }
}
