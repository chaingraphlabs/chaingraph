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
import { Flow } from '@badaitech/chaingraph-types'
import { desc, eq, sql } from 'drizzle-orm'
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
        errorMessage: instance.error?.message || null,
        errorNodeId: instance.error?.nodeId || null,
        executionDepth: instance.executionDepth || 0,
        metadata: {
          flowName: instance.flow.metadata?.name,
          flowData: instance.flow.serialize(),
          contextData: {
            executionId: instance.context.executionId,
            integrations: instance.context.integrations,
            metadata: instance.context.metadata,
            // Store only serializable parts of context
          },
        },
        externalEvents: instance.externalEvents || null,
      })
      .onConflictDoUpdate({
        target: executionsTable.id,
        set: {
          status: instance.status,
          startedAt: instance.startedAt || null,
          completedAt: instance.completedAt || null,
          updatedAt: new Date(),
          errorMessage: instance.error?.message || null,
          errorNodeId: instance.error?.nodeId || null,
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

    const row = results[0]
    const metadata = row.metadata as any

    // Deserialize flow from stored data
    let flow: any
    try {
      flow = metadata?.flowData ? Flow.deserialize(metadata.flowData) : { id: row.flowId }
    } catch (e) {
      // If deserialization fails, use minimal flow object
      flow = { id: row.flowId }
    }

    // Return reconstructed ExecutionInstance
    // Note: engine is not stored and will be null for completed executions
    return {
      id: row.id,
      flow,
      context: metadata?.contextData || { executionId: row.id, integrations: {}, metadata: {} },
      engine: null as any, // Engine is not persisted for completed executions
      status: row.status as any,
      createdAt: row.createdAt,
      startedAt: row.startedAt || undefined,
      completedAt: row.completedAt || undefined,
      error: row.errorMessage
        ? {
            message: row.errorMessage,
            nodeId: row.errorNodeId || undefined,
          }
        : undefined,
      parentExecutionId: row.parentExecutionId || undefined,
      executionDepth: row.executionDepth,
      externalEvents: row.externalEvents as any,
    }
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(executionsTable)
      .where(eq(executionsTable.id, id))
      .returning({ id: executionsTable.id })

    return result.length > 0
  }

  async list(limit?: number): Promise<ExecutionInstance[]> {
    const results = await this.db
      .select()
      .from(executionsTable)
      .orderBy(desc(executionsTable.createdAt))
      .limit(limit || 200)

    return results.map((row) => {
      const metadata = row.metadata as any

      // Deserialize flow from stored data
      let flow: any
      try {
        flow = metadata?.flowData ? Flow.deserialize(metadata.flowData) : { id: row.flowId }
      } catch (e) {
        // If deserialization fails, use minimal flow object
        flow = { id: row.flowId }
      }

      return {
        id: row.id,
        flow,
        context: metadata?.contextData || { executionId: row.id, integrations: {}, metadata: {} },
        engine: null as any, // Engine is not persisted for completed executions
        status: row.status as any,
        createdAt: row.createdAt,
        startedAt: row.startedAt || undefined,
        completedAt: row.completedAt || undefined,
        error: row.errorMessage
          ? {
              message: row.errorMessage,
              nodeId: row.errorNodeId || undefined,
            }
          : undefined,
        parentExecutionId: row.parentExecutionId || undefined,
        executionDepth: row.executionDepth,
        externalEvents: row.externalEvents as any,
      }
    })
  }

  /**
   * Get execution metadata (for completed executions)
   * This returns partial data without engine/flow objects
   */
  async getExecutionMetadata(id: string): Promise<{
    id: string
    flowId: string
    status: string
    createdAt: Date
    completedAt?: Date | null
    error?: { message: string, nodeId?: string } | null
  } | null> {
    const results = await this.db
      .select()
      .from(executionsTable)
      .where(eq(executionsTable.id, id))
      .limit(1)

    if (results.length === 0) {
      return null
    }

    const row = results[0]
    return {
      id: row.id,
      flowId: row.flowId,
      status: row.status,
      createdAt: row.createdAt,
      completedAt: row.completedAt,
      error: row.errorMessage
        ? {
            message: row.errorMessage,
            nodeId: row.errorNodeId || undefined,
          }
        : null,
    }
  }

  /**
   * Get all completed execution metadata
   */
  async listCompletedExecutions(): Promise<Array<{
    id: string
    flowId: string
    status: string
    createdAt: Date
    completedAt?: Date | null
  }>> {
    const results = await this.db
      .select()
      .from(executionsTable)
      .where(sql`${executionsTable.status} IN ('completed', 'failed', 'stopped')`)
      .orderBy(desc(executionsTable.completedAt))

    return results.map(row => ({
      id: row.id,
      flowId: row.flowId,
      status: row.status,
      createdAt: row.createdAt,
      completedAt: row.completedAt,
    }))
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
