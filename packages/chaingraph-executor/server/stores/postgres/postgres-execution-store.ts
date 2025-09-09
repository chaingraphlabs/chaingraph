/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { DBType } from 'server/utils/db'
import type { ExecutionClaim, ExecutionTreeNode, RootExecution } from 'types'
import type { IExecutionStore } from '../interfaces/IExecutionStore'
import type { ExecutionClaimRow, ExecutionRow } from './schema'
import { and, desc, eq, getTableColumns, lt, sql } from 'drizzle-orm'
import { executionClaimsTable, executionsTable } from './schema'

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
          SELECT COALESCE(MAX(${executionsTable.executionDepth}), 0)
          FROM ${executionsTable} children
          WHERE children.root_execution_id = ${executionsTable.id}
        )`.as('levels'),
        totalNested: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${executionsTable} children
          WHERE children.root_execution_id = ${executionsTable.id}
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
   */
  async claimExecution(executionId: string, workerId: string, timeoutMs: number): Promise<boolean> {
    const expiresAt = new Date(Date.now() + timeoutMs)

    try {
      // Use a transaction for atomicity
      return await this.db.transaction(async (tx) => {
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
}
