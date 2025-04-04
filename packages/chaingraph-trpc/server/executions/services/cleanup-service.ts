/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IExecutionStore } from '../store/execution-store'
import type { CleanupConfig } from '../types'
import type { ExecutionService } from './execution-service'
import { DEFAULT_CLEANUP_CONFIG, ExecutionStatus } from '../types'

export class CleanupService {
  private cleanupTimer?: {
    timer: NodeJS.Timer
    [Symbol.dispose]?: () => void
  }

  private readonly config: CleanupConfig

  constructor(
    private readonly store: IExecutionStore,
    private readonly executionService: ExecutionService,
    config?: Partial<CleanupConfig>,
  ) {
    this.config = { ...DEFAULT_CLEANUP_CONFIG, ...config }
  }

  start(): void {
    if (this.cleanupTimer) {
      return
    }

    // Run initial cleanup
    this.cleanup().catch(console.error)

    // Schedule periodic cleanup
    const timer = setInterval(() => {
      this.cleanup().catch(console.error)
    }, this.config.interval)

    // Create wrapper with dispose method
    this.cleanupTimer = {
      timer,
      [Symbol.dispose]: () => {
        clearInterval(timer)
      },
    }
  }

  stop(): void {
    if (this.cleanupTimer) {
      this.cleanupTimer[Symbol.dispose]?.()
      this.cleanupTimer = undefined
    }
  }

  /**
   * Run cleanup process
   */
  async cleanup(): Promise<void> {
    const executions = await this.store.list()
    const now = Date.now()

    // Sort executions by date (newest first)
    const sortedExecutions = executions.sort((a, b) => {
      const aDate = a.completedAt || a.createdAt
      const bDate = b.completedAt || b.createdAt
      return bDate.getTime() - aDate.getTime()
    }) ?? []

    // Track which executions to remove
    const toRemove = new Set<string>()

    // Process based on status and age
    for (const execution of sortedExecutions) {
      // Skip active executions
      if (
        execution.status === ExecutionStatus.Running
        || execution.status === ExecutionStatus.Paused
      ) {
        continue
      }

      // Check age for completed executions
      if (execution.completedAt) {
        const age = now - execution.completedAt.getTime()
        if (age > this.config.maxAge) {
          toRemove.add(execution.id)
          continue
        }
      }

      // Check age for other executions (created but never completed)
      const age = now - execution.createdAt.getTime()
      if (age > this.config.maxAge) {
        toRemove.add(execution.id)
      }
    }

    // If maxExecutions is set, remove oldest executions exceeding the limit
    if (this.config.maxExecutions && sortedExecutions.length > this.config.maxExecutions) {
      const excess = sortedExecutions.length - this.config.maxExecutions
      for (let i = sortedExecutions.length - 1; i >= 0 && i > sortedExecutions.length - excess - 1; i--) {
        if (!sortedExecutions || sortedExecutions[i] === undefined) {
          continue
        }
        toRemove.add(sortedExecutions[i]!.id)
      }
    }

    // Remove marked executions
    for (const id of toRemove) {
      try {
        await this.executionService.dispose(id)
      } catch (error) {
        console.error(`Failed to cleanup execution ${id}:`, error)
      }
    }

    if (toRemove.size > 0) {
      console.log(`Cleaned up ${toRemove.size} old executions`)
    }
  }
}
