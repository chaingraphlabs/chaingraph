/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { DBType } from '../../../server/utils/db'
import type { ExecutionClaim, ExecutionTreeNode, RootExecution } from '../../../types'
import type { IExecutionStore, UpdateExecutionStatusParams } from '../interfaces/IExecutionStore'
import type { ExecutionClaimRow, ExecutionRecoveryRow, ExecutionRow } from './schema'
import { and, desc, eq, getTableColumns, isNull, lt, or, sql } from 'drizzle-orm'
import { executionClaimsTable, executionRecoveryTable, executionsTable } from './schema'

export class PostgresExecutionStore implements IExecutionStore {
  constructor(
    private readonly db: DBType,
  ) {}

  async create(row: ExecutionRow): Promise<void> {
    await this.db.insert(executionsTable)
      .values({
        ...row,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: executionsTable.id,
        set: {
          ...row,
          updatedAt: new Date(),
        },
      })
  }

  async get(id: string): Promise<ExecutionRow | null> {
    const results = await this.db
      .select()
      .from(executionsTable)
      .where(eq(executionsTable.id, id))
      .limit(1)

    if (results.length === 0) {
      return null
    }

    return results[0] as ExecutionRow
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(executionsTable)
      .where(eq(executionsTable.id, id))
      .returning({ id: executionsTable.id })

    return result.length > 0
  }

  /**
   * Atomically update execution status and related fields
   * This method avoids the need to fetch the execution first
   */
  async updateExecutionStatus(params: UpdateExecutionStatusParams): Promise<boolean> {
    const updateData: Partial<typeof executionsTable.$inferInsert> = {
      status: params.status,
      updatedAt: new Date(),
    }

    // Conditionally set error fields
    if (params.errorMessage !== undefined) {
      updateData.errorMessage = params.errorMessage
    }
    if (params.errorNodeId !== undefined) {
      updateData.errorNodeId = params.errorNodeId
    }

    // Handle timestamps - use provided values or set defaults based on status
    if (params.startedAt) {
      updateData.startedAt = params.startedAt
    } else if (params.status === 'running' && !params.completedAt) {
      // Only set default startedAt if status is running and we're not setting completedAt
      updateData.startedAt = new Date()
    }

    if (params.completedAt) {
      updateData.completedAt = params.completedAt
    } else if (params.status === 'completed' || params.status === 'failed' || params.status === 'stopped') {
      // Set default completedAt for terminal states
      updateData.completedAt = new Date()
    }

    // Conditionally set processing tracking fields
    if (params.processingStartedAt !== undefined) {
      updateData.processingStartedAt = params.processingStartedAt
    }
    if (params.processingWorkerId !== undefined) {
      updateData.processingWorkerId = params.processingWorkerId
    }

    // Conditionally set failure tracking fields
    if (params.failureCount !== undefined) {
      updateData.failureCount = params.failureCount
    }
    if (params.lastFailureReason !== undefined) {
      updateData.lastFailureReason = params.lastFailureReason
    }
    if (params.lastFailureAt !== undefined) {
      updateData.lastFailureAt = params.lastFailureAt
    }

    const result = await this.db
      .update(executionsTable)
      .set(updateData)
      .where(eq(executionsTable.id, params.executionId))
      .returning({ id: executionsTable.id })

    return result.length > 0
  }

  async getRootExecutions(
    flowId: string,
    limit = 50,
    after: Date | null = null,
  ): Promise<RootExecution[]> {
    const results = await this.db
      .select({
        // All execution fields using getTableColumns utility
        ...getTableColumns(executionsTable),
        // Calculated fields using subqueries
        levels: sql<number>`(
          SELECT COALESCE(MAX(children.execution_depth), 0)
          FROM chaingraph_executions children
          WHERE children.root_execution_id = chaingraph_executions.id
        )`.as('levels'),
        totalNested: sql<number>`(
          SELECT COUNT(*)::int
          FROM chaingraph_executions children
          WHERE children.root_execution_id = chaingraph_executions.id
        )`.as('totalNested'),
      })
      .from(executionsTable)
      .where(
        and(
          eq(executionsTable.flowId, flowId),
          eq(executionsTable.executionDepth, 0),
          after ? lt(executionsTable.createdAt, after) : undefined,
        ),
      )
      .orderBy(desc(executionsTable.createdAt))
      .limit(limit)

    return results.map((row) => {
      const { levels, totalNested, ...executionFields } = row

      return {
        execution: executionFields,
        levels: levels ?? 0,
        totalNested: totalNested ?? 0,
      }
    })
  }

  /**
   * Get all child executions of a parent
   */
  async getChildExecutions(parentId: string): Promise<ExecutionRow[]> {
    return await this.db
      .select()
      .from(executionsTable)
      .where(eq(executionsTable.parentExecutionId, parentId))
  }

  /**
   * Get the entire execution tree
   */
  async getExecutionTree(rootId: string): Promise<Array<ExecutionTreeNode>> {
    const results = await this.db
      .select()
      .from(executionsTable)
      .where(eq(executionsTable.rootExecutionId, rootId))

    const rawExecutions = results as ExecutionRow[]

    if (rawExecutions.length === 0) {
      return []
    }

    const executionMap = new Map<string, ExecutionRow>()
    const childrenMap = new Map<string, string[]>()

    for (const execution of rawExecutions) {
      executionMap.set(execution.id, execution)

      const parentId = execution.parentExecutionId
      if (parentId) {
        if (!childrenMap.has(parentId)) {
          childrenMap.set(parentId, [])
        }
        childrenMap.get(parentId)!.push(execution.id)
      }
    }

    const result: Array<ExecutionTreeNode> = []

    const traverse = (executionId: string, parentId: string | null, level: number) => {
      const execution = executionMap.get(executionId)
      if (!execution)
        return

      result.push({
        id: executionId,
        parentId,
        level,
        execution,
      })

      const children = childrenMap.get(executionId) || []
      for (const childId of children) {
        traverse(childId, executionId, level + 1)
      }
    }

    traverse(rootId, null, 0)

    result.sort((a, b) => {
      if (a.level !== b.level) {
        return a.level - b.level
      }
      return a.id.localeCompare(b.id)
    })

    return result
  }

  /**
   * Claim an execution for a worker atomically
   * Uses PostgreSQL row-level locking to ensure only one worker can claim an execution
   * Also updates the execution's processing fields in the same transaction
   */
  async claimExecution(executionId: string, workerId: string, timeoutMs: number): Promise<boolean> {
    const expiresAt = new Date(Date.now() + timeoutMs)
    const now = new Date()

    try {
      // Use a transaction for atomicity
      return await this.db.transaction(async (tx) => {
        // First, check the execution status
        const execution = await tx
          .select()
          .from(executionsTable)
          .where(eq(executionsTable.id, executionId))
          .for('update') // Lock the execution row
          .limit(1)

        if (execution.length === 0) {
          return false // Execution doesn't exist
        }

        const executionRow = execution[0]

        // Don't claim if already in terminal state
        if (executionRow.status === 'completed' || executionRow.status === 'failed') {
          return false
        }

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
          if (claim.expiresAt < now && claim.status === 'active') {
            // Expired claim, update it
            await tx
              .update(executionClaimsTable)
              .set({
                workerId,
                claimedAt: now,
                expiresAt,
                heartbeatAt: now,
                status: 'active',
              })
              .where(eq(executionClaimsTable.executionId, executionId))

            // Update execution's processing info
            await tx
              .update(executionsTable)
              .set({
                processingWorkerId: workerId,
                processingStartedAt: now,
                updatedAt: now,
              })
              .where(eq(executionsTable.id, executionId))

            return true
          }
          // Claim exists and is not expired
          return false
        }

        // No existing claim, create new one
        await tx.insert(executionClaimsTable).values({
          executionId,
          workerId,
          claimedAt: now,
          expiresAt,
          heartbeatAt: now,
          status: 'active',
        })

        // Update execution's processing info
        await tx
          .update(executionsTable)
          .set({
            processingWorkerId: workerId,
            processingStartedAt: now,
            updatedAt: now,
          })
          .where(eq(executionsTable.id, executionId))

        return true
      })
    } catch (error) {
      // Handle unique constraint violation (race condition)
      if ((error as Error & { code?: string }).code === '23505') {
        return false
      }
      throw error
    }
  }

  /**
   * Release an execution claim
   * Also clears the processing fields in the execution row
   */
  async releaseExecution(executionId: string, workerId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      // Release the claim
      await tx
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

      // Clear processing info from execution
      await tx
        .update(executionsTable)
        .set({
          processingWorkerId: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(executionsTable.id, executionId),
            eq(executionsTable.processingWorkerId, workerId),
          ),
        )
    })
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

    return results.map((row: ExecutionClaimRow) => ({
      executionId: row.executionId,
      workerId: row.workerId,
      claimedAt: row.claimedAt,
      expiresAt: row.expiresAt,
      heartbeatAt: row.heartbeatAt,
      status: row.status,
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

    const row = results[0] as ExecutionClaimRow
    return {
      executionId: row.executionId,
      workerId: row.workerId,
      claimedAt: row.claimedAt,
      expiresAt: row.expiresAt,
      heartbeatAt: row.heartbeatAt,
      status: row.status,
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

  /**
   * Update failure count and reason for an execution
   */
  async updateFailureInfo(
    executionId: string,
    failureCount: number,
    reason: string,
  ): Promise<boolean> {
    const result = await this.db
      .update(executionsTable)
      .set({
        failureCount,
        lastFailureReason: reason,
        lastFailureAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(executionsTable.id, executionId))
      .returning({ id: executionsTable.id })

    return result.length > 0
  }

  /**
   * Get executions that need recovery
   * Finds executions that are:
   * 1. Status = 'created' but no active claim
   * 2. Status = 'running' but claim expired
   * 3. Status = 'created' with failureCount < 5 and lastFailureAt > 1 minute ago
   */
  async getExecutionsNeedingRecovery(limit = 100): Promise<ExecutionRow[]> {
    const oneMinuteAgo = new Date(Date.now() - 60000)

    const results = await this.db
      .select({
        ...getTableColumns(executionsTable),
        claimId: executionClaimsTable.executionId,
        claimStatus: executionClaimsTable.status,
        claimExpiresAt: executionClaimsTable.expiresAt,
      })
      .from(executionsTable)
      .leftJoin(
        executionClaimsTable,
        and(
          eq(executionsTable.id, executionClaimsTable.executionId),
          eq(executionClaimsTable.status, 'active'),
        ),
      )
      .where(
        or(
          // No active claim for created executions
          and(
            eq(executionsTable.status, sql`'created'`),
            isNull(executionClaimsTable.executionId),
            eq(executionsTable.failureCount, 0),
          ),
          // Expired claim for running executions
          and(
            eq(executionsTable.status, sql`'running'`),
            lt(executionClaimsTable.expiresAt, new Date()),
          ),
          // Failed executions ready for retry
          and(
            eq(executionsTable.status, sql`'created'`),
            lt(executionsTable.failureCount, 5),
            lt(executionsTable.lastFailureAt, oneMinuteAgo),
          ),
        ),
      )
      .limit(limit)

    // Map back to ExecutionRow type by removing join columns
    return results.map(({ claimId, claimStatus, claimExpiresAt, ...execution }) => execution as ExecutionRow)
  }

  /**
   * Record a recovery action for an execution
   */
  async recordRecovery(
    executionId: string,
    workerId: string,
    reason: string,
    previousStatus?: string,
    previousWorkerId?: string,
  ): Promise<void> {
    await this.db.insert(executionRecoveryTable).values({
      executionId,
      recoveredByWorker: workerId,
      recoveryReason: reason,
      previousStatus,
      previousWorkerId,
      recoveredAt: new Date(),
    })
  }

  /**
   * Get recovery history for an execution
   */
  async getRecoveryHistory(executionId: string): Promise<ExecutionRecoveryRow[]> {
    return await this.db
      .select()
      .from(executionRecoveryTable)
      .where(eq(executionRecoveryTable.executionId, executionId))
      .orderBy(desc(executionRecoveryTable.recoveredAt))
  }

  /**
   * Try to acquire a PostgreSQL advisory lock
   * Returns true if lock was acquired, false if another session holds it
   */
  async tryAcquireRecoveryLock(lockId: number): Promise<boolean> {
    try {
      const result = await this.db.execute<{ acquired: boolean }>(
        sql`SELECT pg_try_advisory_lock(${lockId}) as acquired`,
      )

      return result[0]?.acquired ?? false
    } catch (error) {
      // If error occurs, assume lock not acquired
      return false
    }
  }

  /**
   * Release a PostgreSQL advisory lock
   */
  async releaseRecoveryLock(lockId: number): Promise<void> {
    try {
      await this.db.execute(
        sql`SELECT pg_advisory_unlock(${lockId})`,
      )
    } catch (error) {
      // Log but don't throw - lock will auto-release on connection close
    }
  }
}
