/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionRow } from '@badaitech/chaingraph-trpc/server'
import type { ExecutionContext, IFlow } from '@badaitech/chaingraph-types'
import type { DBType } from 'server/utils/db'
import type { ExecutionClaim, ExecutionInstance, ExecutionStatus } from '../../types'
import type { IExecutionStore } from '../interfaces/IExecutionStore'
import { executionClaimsTable, executionsTable } from '@badaitech/chaingraph-trpc/server'
import { NodeRegistry } from '@badaitech/chaingraph-types'
import { Flow } from '@badaitech/chaingraph-types'
import { and, desc, eq, lt, sql } from 'drizzle-orm'

export class PostgresExecutionStore implements IExecutionStore {
  private readonly MAX_EXECUTION_DEPTH = 100

  constructor(
    private readonly db: DBType,
    private nodeRegistry: NodeRegistry = NodeRegistry.getInstance(),
  ) {}

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
          flowData: instance.parentExecutionId ? null : instance.flow.serialize(),
          contextData: {
            executionId: instance.context.executionId,
            eventData: instance.context.eventData || null,
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

    const row = results[0] as ExecutionRow
    const metadata = row.metadata

    // Deserialize flow from stored data
    let flow: IFlow

    if (!metadata?.flowData && row.parentExecutionId) {
      let currentParentId: string | null = row.parentExecutionId
      let flowData = null
      let depth = 0
      while (currentParentId && !flowData && depth < this.MAX_EXECUTION_DEPTH) {
        const parentResults = await this.db
          .select()
          .from(executionsTable)
          .where(eq(executionsTable.id, currentParentId))
          .limit(1)

        if (parentResults.length === 0)
          break

        const parentRow = parentResults[0] as ExecutionRow
        const parentMetadata = parentRow.metadata

        if (parentMetadata?.flowData) {
          flowData = parentMetadata.flowData
          break
        }

        currentParentId = parentRow.parentExecutionId
        depth++
      }
      if (flowData) {
        try {
          flow = Flow.deserialize(flowData, this.nodeRegistry)
        } catch (e) {
          flow = new Flow({ id: row.flowId, name: metadata?.flowName })
        }
      } else {
        flow = new Flow({ id: row.flowId, name: metadata?.flowName })
      }
    } else {
      try {
        flow = metadata?.flowData
          ? Flow.deserialize(metadata.flowData, this.nodeRegistry)
          : new Flow({ id: row.flowId, name: metadata?.flowName })
      } catch (e) {
        flow = new Flow({ id: row.flowId, name: metadata?.flowName })
      }
    }

    // Return reconstructed ExecutionInstance
    return {
      id: row.id,
      flow: flow as Flow,
      initialStateFlow: await flow.clone() as Flow,
      context: {
        executionId: metadata?.contextData?.executionId || row.id,
        eventData: metadata?.contextData?.eventData || undefined,
        integrations: {},
        metadata: {},
      } as ExecutionContext,
      engine: null,
      status: row.status as ExecutionStatus,
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
      externalEvents: row.externalEvents as Array<{ type: string, data?: any }>,
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
      .select({
        id: executionsTable.id,
        flowId: executionsTable.flowId,
        ownerId: executionsTable.ownerId,
        parentExecutionId: executionsTable.parentExecutionId,
        status: executionsTable.status,
        createdAt: executionsTable.createdAt,
        startedAt: executionsTable.startedAt,
        completedAt: executionsTable.completedAt,
        errorMessage: executionsTable.errorMessage,
        errorNodeId: executionsTable.errorNodeId,
        executionDepth: executionsTable.executionDepth,
        externalEvents: executionsTable.externalEvents,
        flowName: sql<string>`${executionsTable.metadata}->>'flowName'`,
        eventData: sql<any>`${executionsTable.metadata}->'contextData'->'eventData'`,
      })
      .from(executionsTable)
      .orderBy(desc(executionsTable.createdAt))
      .limit(limit || 200)

    return results.map((row) => {
      const flow = new Flow({
        id: row.flowId,
        name: row.flowName || 'Unnamed Flow',
        ownerID: row.ownerId || undefined,
      })

      return {
        id: row.id,
        flow,
        initialStateFlow: flow,
        context: {
          executionId: row.id,
          eventData: row.eventData || undefined,
          integrations: {},
          metadata: {},
        } as any,
        engine: null as any,
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
   * Get all child executions of a parent
   */
  async getChildExecutions(parentId: string): Promise<string[]> {
    const results = await this.db
      .select({ id: executionsTable.id })
      .from(executionsTable)
      .where(eq(executionsTable.parentExecutionId, parentId))

    return results.map((r: any) => r.id)
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

    return results.map((r: any) => ({
      id: r.id,
      parentId: r.parentId,
      level: Number(r.level),
    }))
  }

  /**
   * Claim an execution for a worker atomically
   * Uses PostgreSQL row-level locking to ensure only one worker can claim an execution
   */
  async claimExecution(executionId: string, workerId: string, timeoutMs: number): Promise<boolean> {
    const expiresAt = new Date(Date.now() + timeoutMs)

    try {
      // Use a transaction for atomicity
      const result = await this.db.transaction(async (tx: any) => {
        // Check if execution exists and is not already claimed
        const existingClaim = await tx
          .select()
          .from(executionClaimsTable)
          .where(eq(executionClaimsTable.executionId, executionId))
          .for('update') // Row-level lock
          .limit(1)

        if (existingClaim.length > 0) {
          const claim = existingClaim[0]
          // Check if claim is expired
          if (claim.expiresAt < new Date() && claim.status === 'active') {
            // Expired claim, update it
            await tx
              .update(executionClaimsTable)
              .set({
                workerId,
                claimedAt: new Date(),
                expiresAt,
                heartbeatAt: new Date(),
                status: 'active',
              })
              .where(eq(executionClaimsTable.executionId, executionId))
            return true
          }
          // Claim exists and is not expired
          return false
        }

        // No existing claim, create new one
        await tx.insert(executionClaimsTable).values({
          executionId,
          workerId,
          claimedAt: new Date(),
          expiresAt,
          heartbeatAt: new Date(),
          status: 'active',
        })
        return true
      })

      return result
    } catch (error) {
      // Handle unique constraint violation (race condition)
      if ((error as any).code === '23505') {
        return false
      }
      throw error
    }
  }

  /**
   * Release an execution claim
   */
  async releaseExecution(executionId: string, workerId: string): Promise<void> {
    await this.db
      .update(executionClaimsTable)
      .set({
        status: 'released',
      })
      .where(
        and(
          eq(executionClaimsTable.executionId, executionId),
          eq(executionClaimsTable.workerId, workerId),
        ),
      )
  }

  /**
   * Extend an execution claim (heartbeat)
   */
  async extendClaim(executionId: string, workerId: string, timeoutMs: number): Promise<boolean> {
    const expiresAt = new Date(Date.now() + timeoutMs)

    const result = await this.db
      .update(executionClaimsTable)
      .set({
        expiresAt,
        heartbeatAt: new Date(),
      })
      .where(
        and(
          eq(executionClaimsTable.executionId, executionId),
          eq(executionClaimsTable.workerId, workerId),
          eq(executionClaimsTable.status, 'active'),
        ),
      )
      .returning({ executionId: executionClaimsTable.executionId })

    return result.length > 0
  }

  /**
   * Get all active claims
   */
  async getActiveClaims(): Promise<ExecutionClaim[]> {
    const results = await this.db
      .select()
      .from(executionClaimsTable)
      .where(eq(executionClaimsTable.status, 'active'))

    return results.map((row: any) => ({
      executionId: row.executionId,
      workerId: row.workerId,
      claimedAt: row.claimedAt,
      expiresAt: row.expiresAt,
      heartbeatAt: row.heartbeatAt,
      status: row.status as 'active' | 'released' | 'expired',
    }))
  }

  /**
   * Get claim for a specific execution
   */
  async getClaimForExecution(executionId: string): Promise<ExecutionClaim | null> {
    const results = await this.db
      .select()
      .from(executionClaimsTable)
      .where(eq(executionClaimsTable.executionId, executionId))
      .limit(1)

    if (results.length === 0) {
      return null
    }

    const row = results[0]
    return {
      executionId: row.executionId,
      workerId: row.workerId,
      claimedAt: row.claimedAt,
      expiresAt: row.expiresAt,
      heartbeatAt: row.heartbeatAt,
      status: row.status as 'active' | 'released' | 'expired',
    }
  }

  /**
   * Expire old claims that have passed their expiration time
   */
  async expireOldClaims(): Promise<number> {
    const result = await this.db
      .update(executionClaimsTable)
      .set({
        status: 'expired',
      })
      .where(
        and(
          lt(executionClaimsTable.expiresAt, new Date()),
          eq(executionClaimsTable.status, 'active'),
        ),
      )
      .returning({ executionId: executionClaimsTable.executionId })

    return result.length
  }
}
