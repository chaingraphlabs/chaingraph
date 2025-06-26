/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionInstance } from '../../types'
import type { IExecutionStore, InMemoryExecutionStore } from '../execution-store'
import type { PostgresEventStore } from './event-store'
import type { PostgresExecutionStore } from './execution-store'

export class HybridExecutionStore implements IExecutionStore {
  constructor(
    private readonly memoryStore: InMemoryExecutionStore,
    private readonly postgresStore: PostgresExecutionStore,
    private readonly eventStore: PostgresEventStore,
  ) {}

  async create(instance: ExecutionInstance): Promise<void> {
    // Always write to memory store
    await this.memoryStore.create(instance)

    // Only write completed executions to PostgreSQL
    // Active executions (created, running, paused) stay in memory only
    const completedStatuses = ['completed', 'failed', 'stopped']
    if (completedStatuses.includes(instance.status)) {
      await this.postgresStore.create(instance).catch((error) => {
        console.error(`Failed to persist completed execution ${instance.id} to PostgreSQL:`, error)
        // Don't throw - allow operation to continue with in-memory store
      })
    }
  }

  async get(id: string): Promise<ExecutionInstance | null> {
    // Try memory first (for active executions)
    const memoryResult = await this.memoryStore.get(id)
    if (memoryResult) {
      return memoryResult
    }

    return this.postgresStore.get(id)
  }

  async delete(id: string): Promise<boolean> {
    // Delete from both stores
    const [memoryResult, postgresResult] = await Promise.all([
      this.memoryStore.delete(id),
      this.postgresStore.delete(id).catch((error) => {
        console.error(`Failed to delete execution ${id} from PostgreSQL:`, error)
        return false
      }),
    ])

    // Also delete associated events
    await this.eventStore.deleteEvents(id).catch((error) => {
      console.error(`Failed to delete events for execution ${id}:`, error)
    })

    return memoryResult || postgresResult
  }

  async list(limit?: number): Promise<ExecutionInstance[]> {
    // Get active executions from memory
    const memoryExecutions = await this.memoryStore.list(limit)

    // Get completed executions from PostgreSQL
    const postgresExecutions = await this.postgresStore.list(limit)

    // Create a map to avoid duplicates (memory takes precedence)
    const executionMap = new Map<string, ExecutionInstance>()

    // Add PostgreSQL executions first
    for (const exec of postgresExecutions) {
      executionMap.set(exec.id, exec)
    }

    // Override with memory executions (more up-to-date for active ones)
    for (const exec of memoryExecutions) {
      executionMap.set(exec.id, exec)
    }

    // Return all executions, sorted by createdAt descending
    const allExecutions = Array.from(executionMap.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    // Apply limit if specified
    return limit ? allExecutions.slice(0, limit) : allExecutions
  }

  /**
   * Get execution metadata from PostgreSQL (for completed executions)
   */
  async getExecutionMetadata(id: string): Promise<{
    id: string
    flowId: string
    status: string
    createdAt: Date
    completedAt?: Date | null
    error?: { message: string, nodeId?: string } | null
  } | null> {
    return this.postgresStore.getExecutionMetadata(id)
  }

  /**
   * Get all completed executions from PostgreSQL
   */
  async listCompletedExecutions(): Promise<Array<{
    id: string
    flowId: string
    status: string
    createdAt: Date
    completedAt?: Date | null
  }>> {
    return this.postgresStore.listCompletedExecutions()
  }

  /**
   * Get child executions from PostgreSQL
   */
  async getChildExecutions(parentId: string): Promise<string[]> {
    return this.postgresStore.getChildExecutions(parentId)
  }

  /**
   * Get execution tree from PostgreSQL
   */
  async getExecutionTree(rootId: string): Promise<Array<{ id: string, parentId: string | null, level: number }>> {
    return this.postgresStore.getExecutionTree(rootId)
  }

  /**
   * Flush any pending event batches
   */
  async flush(): Promise<void> {
    await this.eventStore.flushAll()
  }
}
