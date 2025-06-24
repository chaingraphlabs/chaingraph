/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { DBType } from '../../../context'
import type { ExecutionInstance } from '../../types'
import type { IExecutionStore } from '../execution-store'
import { eq, sql } from 'drizzle-orm'
import { executionsTable } from '../../../stores/postgres/schema'

export class PostgresExecutionStore implements IExecutionStore {
  constructor(private readonly db: DBType) {}

  async create(instance: ExecutionInstance): Promise<void> {
    await this.db.insert(executionsTable)
      .values({
        id: instance.id,
        flowId: instance.flow.id || '',
        ownerId: instance.flow.metadata.ownerID,
        parentExecutionId: instance.parentExecutionId || null,
        status: instance.status,
        startedAt: instance.startedAt || null,
        completedAt: instance.completedAt || null,
        createdAt: instance.createdAt,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: executionsTable.id,
        set: {
          status: instance.status,
          startedAt: instance.startedAt || null,
          completedAt: instance.completedAt || null,
          updatedAt: new Date(),
        },
      })
  }

  async get(id: string): Promise<ExecutionInstance | null> {
    const results = await this.db
      .select()
      .from(executionsTable)
      .where(eq(executionsTable.id, id))
      .limit(1)

    if (results.length === 0) {
      return null
    }

    // Note: This returns only the persisted metadata
    // The full ExecutionInstance with engine and flow is reconstructed
    // by the ExecutionService when needed
    return null
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(executionsTable)
      .where(eq(executionsTable.id, id))

    return true
  }

  async list(): Promise<ExecutionInstance[]> {
    // Note: This returns only the persisted metadata
    // The full ExecutionInstance with engine and flow is reconstructed
    // by the ExecutionService when needed
    return []
  }

  /**
   * Get all child executions of a parent
   */
  async getChildExecutions(parentId: string): Promise<string[]> {
    const results = await this.db
      .select({ id: executionsTable.id })
      .from(executionsTable)
      .where(eq(executionsTable.parentExecutionId, parentId))

    return results.map(r => r.id)
  }

  /**
   * Get the entire execution tree recursively
   */
  async getExecutionTree(rootId: string): Promise<Array<{ id: string, parentId: string | null, level: number }>> {
    const query = this.db.$with('execution_tree').as(
      this.db
        .select({
          id: executionsTable.id,
          parentId: executionsTable.parentExecutionId,
          level: sql`0`.as('level'),
        })
        .from(executionsTable)
        .where(eq(executionsTable.id, rootId))
        .unionAll(
          this.db
            .select({
              id: executionsTable.id,
              parentId: executionsTable.parentExecutionId,
              level: sql`et.level + 1`.as('level'),
            })
            .from(executionsTable)
            .innerJoin(
              sql`execution_tree et`,
              eq(executionsTable.parentExecutionId, sql`et.id`),
            ),
        ),
    )

    const results = await this.db
      .with(query)
      .select()
      .from(query)

    return results.map(r => ({
      id: r.id,
      parentId: r.parentId,
      level: Number(r.level),
    }))
  }
}
