/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IExecutionStore } from '../stores/interfaces/IExecutionStore'
import type { ITaskQueue } from '../interfaces/ITaskQueue'
import type { ExecutionRow } from '../stores/postgres/schema'
import { ExecutionStatus } from '../../types'
import { config } from '../utils/config'
import { createLogger } from '../utils/logger'

const logger = createLogger('recovery-service')

/**
 * RecoveryService handles automatic recovery of stuck/failed executions
 * Uses PostgreSQL advisory locks to ensure only one recovery process runs across all workers
 */
export class RecoveryService {
  private readonly SCAN_INTERVAL_MS = config.recovery?.scanIntervalMs || 30_000 // 30 seconds
  private readonly MAX_FAILURE_COUNT = config.recovery?.maxFailureCount || 5
  private readonly RECOVERY_LOCK_ID = 987654321 // Unique lock ID for recovery process
  private recoveryTimer?: NodeJS.Timeout
  private isRunning = false
  private readonly workerId: string
  private readonly failedRecoveryAttempts: Map<string, number> = new Map() // Track failed publish attempts

  constructor(
    private readonly store: IExecutionStore,
    private readonly taskQueue: ITaskQueue,
    workerId: string,
  ) {
    this.workerId = workerId
  }

  /**
   * Start the recovery service background process
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn({ workerId: this.workerId }, 'Recovery service already running')
      return
    }

    this.isRunning = true
    logger.info({
      workerId: this.workerId,
      scanInterval: this.SCAN_INTERVAL_MS,
      maxFailureCount: this.MAX_FAILURE_COUNT,
    }, 'Starting recovery service')

    // Run initial recovery scan
    await this.scanAndRecover()

    // Schedule periodic recovery scans
    this.recoveryTimer = setInterval(async () => {
      await this.scanAndRecover()
    }, this.SCAN_INTERVAL_MS)
  }

  /**
   * Stop the recovery service
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    logger.info({ workerId: this.workerId }, 'Stopping recovery service')

    if (this.recoveryTimer) {
      clearInterval(this.recoveryTimer)
      this.recoveryTimer = undefined
    }

    // Release advisory lock if held
    await this.releaseRecoveryLock()

    this.isRunning = false
  }

  /**
   * Manually trigger a recovery scan
   * Useful for immediate recovery after detecting expired claims
   */
  async triggerRecoveryScan(): Promise<void> {
    if (!this.isRunning) {
      logger.warn({
        workerId: this.workerId,
      }, 'Recovery service not running, cannot trigger scan')
      return
    }

    logger.debug({
      workerId: this.workerId,
    }, 'Manual recovery scan triggered')

    await this.scanAndRecover()
  }

  /**
   * Scan for executions needing recovery and recover them
   * Uses distributed lock to ensure only one worker runs recovery at a time
   */
  private async scanAndRecover(): Promise<void> {
    const scanStartTime = Date.now()
    let lockAcquired = false

    try {
      // Try to acquire advisory lock
      lockAcquired = await this.acquireRecoveryLock()

      if (!lockAcquired) {
        logger.debug({
          workerId: this.workerId,
        }, 'Another worker is running recovery, skipping this scan')
        return
      }

      logger.debug({
        workerId: this.workerId,
      }, 'Acquired recovery lock, starting scan')

      // First expire old claims
      const expiredCount = await this.store.expireOldClaims()
      if (expiredCount > 0) {
        logger.info({
          workerId: this.workerId,
          expiredCount,
        }, 'Expired old claims')
      }

      // Get executions that need recovery
      const executionsNeedingRecovery = await this.store.getExecutionsNeedingRecovery(100)

      if (executionsNeedingRecovery.length === 0) {
        logger.debug({
          workerId: this.workerId,
          scanDuration: Date.now() - scanStartTime,
        }, 'No executions need recovery')
        return
      }

      logger.info({
        workerId: this.workerId,
        count: executionsNeedingRecovery.length,
      }, 'Found executions needing recovery')

      // Recover each execution
      let recoveredCount = 0
      let skippedCount = 0
      let failedCount = 0

      for (const execution of executionsNeedingRecovery) {
        try {
          const recovered = await this.recoverExecution(execution)
          if (recovered) {
            recoveredCount++
          } else {
            skippedCount++
          }
        } catch (error) {
          failedCount++
          logger.error({
            error: error instanceof Error ? error.message : String(error),
            executionId: execution.id,
            workerId: this.workerId,
          }, 'Failed to recover execution')
        }
      }

      logger.info({
        workerId: this.workerId,
        total: executionsNeedingRecovery.length,
        recovered: recoveredCount,
        skipped: skippedCount,
        failed: failedCount,
        scanDuration: Date.now() - scanStartTime,
      }, 'Recovery scan completed')
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        workerId: this.workerId,
      }, 'Error during recovery scan')
    } finally {
      // Only release the lock if we acquired it
      if (lockAcquired) {
        await this.releaseRecoveryLock()
      }
    }
  }

  /**
   * Recover a single execution by republishing to Kafka
   */
  private async recoverExecution(execution: ExecutionRow): Promise<boolean> {
    const recoveryStartTime = Date.now()

    try {
      // Determine recovery reason
      const claim = await this.store.getClaimForExecution(execution.id)
      let recoveryReason: string
      let previousStatus: string | undefined
      let previousWorkerId: string | undefined

      if (execution.status === 'running' && claim?.status === 'expired') {
        recoveryReason = 'expired_claim'
        previousStatus = execution.status
        previousWorkerId = claim.workerId
      } else if (execution.status === 'created' && !claim) {
        recoveryReason = 'no_claim'
        previousStatus = execution.status
      } else if (execution.status === 'created' && execution.failureCount > 0) {
        recoveryReason = 'retry_after_failure'
        previousStatus = execution.status
        previousWorkerId = execution.processingWorkerId || undefined
      } else {
        // Unknown state, skip
        logger.warn({
          executionId: execution.id,
          status: execution.status,
          hasClaim: !!claim,
          claimStatus: claim?.status,
          failureCount: execution.failureCount,
        }, 'Execution state unclear, skipping recovery')
        return false
      }

      // Check if failure count exceeds maximum
      if (execution.failureCount >= this.MAX_FAILURE_COUNT) {
        logger.warn({
          executionId: execution.id,
          failureCount: execution.failureCount,
          maxFailureCount: this.MAX_FAILURE_COUNT,
        }, 'Execution exceeded max failures, marking as permanently failed')

        await this.store.updateExecutionStatus({
          executionId: execution.id,
          status: ExecutionStatus.Failed,
          errorMessage: `Exceeded maximum failure count (${this.MAX_FAILURE_COUNT})`,
        })

        // Record recovery action (marking as failed)
        await this.store.recordRecovery(
          execution.id,
          this.workerId,
          'max_failures_exceeded',
          previousStatus,
          previousWorkerId,
        )

        return true
      }

      logger.info({
        executionId: execution.id,
        recoveryReason,
        failureCount: execution.failureCount,
        previousStatus,
        previousWorkerId,
      }, 'Recovering execution')

      // Republish task to Kafka with retry handling
      try {
        await this.taskQueue.publishTask({
          executionId: execution.id,
          flowId: execution.flowId,
          timestamp: Date.now(),
          retryCount: execution.failureCount, // Use failure count as retry count
          maxRetries: this.MAX_FAILURE_COUNT,
        })

        // Clear failed recovery attempts on success
        this.failedRecoveryAttempts.delete(execution.id)

        // Record recovery action
        await this.store.recordRecovery(
          execution.id,
          this.workerId,
          recoveryReason,
          previousStatus,
          previousWorkerId,
        )

        logger.info({
          executionId: execution.id,
          recoveryReason,
          recoveryDuration: Date.now() - recoveryStartTime,
        }, 'Successfully recovered execution')

        return true
      } catch (publishError) {
        // Track failed recovery publish attempts
        const attemptCount = (this.failedRecoveryAttempts.get(execution.id) || 0) + 1
        this.failedRecoveryAttempts.set(execution.id, attemptCount)

        logger.error({
          error: publishError instanceof Error ? publishError.message : String(publishError),
          executionId: execution.id,
          workerId: this.workerId,
          attemptCount,
        }, 'Failed to republish task during recovery')

        // If we've failed to recover this execution 5 times, mark it as permanently failed
        if (attemptCount >= 5) {
          logger.error({
            executionId: execution.id,
            attemptCount,
          }, 'Recovery publish failed 5 times, marking execution as permanently failed')

          await this.store.updateExecutionStatus({
            executionId: execution.id,
            status: ExecutionStatus.Failed,
            errorMessage: `Recovery failed after ${attemptCount} republish attempts: ${publishError instanceof Error ? publishError.message : String(publishError)}`,
          })

          // Record recovery failure
          await this.store.recordRecovery(
            execution.id,
            this.workerId,
            'recovery_publish_failed',
            previousStatus,
            previousWorkerId,
          )

          // Clear from tracking
          this.failedRecoveryAttempts.delete(execution.id)
        }

        // Don't throw - continue with other executions
        return false
      }
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        executionId: execution.id,
        workerId: this.workerId,
      }, 'Failed to recover execution')
      throw error
    }
  }

  /**
   * Acquire PostgreSQL advisory lock for recovery process
   * Returns true if lock was acquired, false if another worker holds it
   */
  private async acquireRecoveryLock(): Promise<boolean> {
    try {
      const acquired = await this.store.tryAcquireRecoveryLock(this.RECOVERY_LOCK_ID)

      if (acquired) {
        logger.debug({
          workerId: this.workerId,
          lockId: this.RECOVERY_LOCK_ID,
        }, 'Acquired recovery advisory lock')
      }

      return acquired
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        workerId: this.workerId,
      }, 'Failed to acquire recovery lock')
      return false
    }
  }

  /**
   * Release PostgreSQL advisory lock for recovery process
   */
  private async releaseRecoveryLock(): Promise<void> {
    try {
      await this.store.releaseRecoveryLock(this.RECOVERY_LOCK_ID)

      logger.debug({
        workerId: this.workerId,
        lockId: this.RECOVERY_LOCK_ID,
      }, 'Released recovery advisory lock')
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        workerId: this.workerId,
      }, 'Failed to release recovery lock')
    }
  }

}
