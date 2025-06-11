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
    // Write to both stores in parallel
    // Note: create is actually an upsert operation that updates if exists
    await Promise.all([
      this.memoryStore.create(instance),
      this.postgresStore.create(instance).catch((error) => {
        console.error(`Failed to persist execution ${instance.id} to PostgreSQL:`, error)
        // Don't throw - allow operation to continue with in-memory store
      }),
    ])
  }

  async get(id: string): Promise<ExecutionInstance | null> {
    // Try memory first (for active executions)
    const memoryResult = await this.memoryStore.get(id)
    if (memoryResult) {
      return memoryResult
    }

    // For completed executions, we would need to reconstruct from PostgreSQL
    // For now, return null as full reconstruction requires flow data
    return null
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

  async list(): Promise<ExecutionInstance[]> {
    // Return from memory store only (active executions)
    return this.memoryStore.list()
  }

  /**
   * Flush any pending event batches
   */
  async flush(): Promise<void> {
    await this.eventStore.flushAll()
  }
}
