/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionTask } from '../../../types'
import type { ITaskQueue, TaskHandler } from '../../interfaces/ITaskQueue'
import { DBOS } from '@dbos-inc/dbos-sdk'
import { QUEUE_NAME } from '../../dbos/queue'
import { ExecutionWorkflows } from '../../dbos/workflows/ExecutionWorkflows'
import { createLogger } from '../../utils/logger'

const logger = createLogger('dbos-task-queue')

/**
 * DBOS-based implementation of ITaskQueue interface
 *
 * This implementation uses DBOS Durable Queues with direct DBOS.startWorkflow() calls.
 * It provides a compatible interface with the existing ITaskQueue so it can be used
 * as a drop-in replacement in the system.
 *
 * Key Features:
 * - Uses @DBOS.workflow() decorated class method directly
 * - No manual offset management (DBOS handles it)
 * - No consumer groups (DBOS handles distribution)
 * - consumeTasks() is a no-op (DBOS auto-consumes via workflow registration)
 * - Built-in exactly-once semantics through idempotency
 *
 * Usage:
 * ```typescript
 * const taskQueue = new DBOSTaskQueue();
 *
 * // Publish task - uses DBOS.startWorkflow() directly
 * await taskQueue.publishTask(task);
 *
 * // Consumption is automatic - no need to call consumeTasks()
 * ```
 */
export class DBOSTaskQueue implements ITaskQueue {
  private readonly queueName: string

  /**
   * Create a DBOS task queue
   *
   * @param queueName Optional queue name (defaults to 'chaingraph-executions')
   */
  constructor(queueName: string = QUEUE_NAME) {
    this.queueName = queueName
    logger.info({ queueName }, 'DBOS task queue initialized')
  }

  /**
   * Publish an execution task to the DBOS queue
   *
   * Uses DBOS.startWorkflow() directly with the ExecutionWorkflows class.
   * The task will be durably stored in PostgreSQL and eventually processed
   * by a worker. DBOS guarantees at-least-once execution.
   *
   * @param task Execution task to publish
   */
  async publishTask(task: ExecutionTask): Promise<void> {
    logger.debug({ executionId: task.executionId }, 'Publishing task to DBOS queue')

    try {
      // Use DBOS.startWorkflow() directly with the class-based workflow
      await DBOS.startWorkflow(ExecutionWorkflows, {
        queueName: this.queueName,
        workflowID: task.executionId, // Use execution ID as workflow ID for easy tracking
        timeoutMS: 35 * 60 * 1000, // 35 minute timeout for long-running executions
        enqueueOptions: {
          deduplicationID: task.executionId, // Prevent duplicate executions via deduplication
        },
      }).executeChainGraph(task)

      logger.info({ executionId: task.executionId }, 'Task published to DBOS queue')
    } catch (error) {
      logger.error({
        error,
        executionId: task.executionId,
      }, 'Failed to publish task to DBOS queue')
      throw error
    }
  }

  /**
   * Consume tasks from the queue
   *
   * NOTE: This is a no-op for DBOS implementation because DBOS automatically
   * consumes from the queue through workflow registration. Workers don't need
   * to manually subscribe - DBOS handles consumption internally.
   *
   * The handler parameter is ignored because DBOS workflows are registered
   * via the @DBOS.workflow() decorator.
   *
   * @param _handler Task handler (unused in DBOS implementation)
   */
  async consumeTasks(_handler: TaskHandler): Promise<void> {
    logger.info('DBOS automatically consumes from queue via workflow registration')
    // No-op: DBOS handles consumption automatically
  }

  /**
   * Stop consuming tasks
   *
   * NOTE: This is handled by DBOSExecutionWorker.stop() which shuts down
   * the entire DBOS runtime. Individual task queues don't need to stop.
   */
  async stopConsuming(): Promise<void> {
    logger.info('DBOS task consumption will stop when worker shuts down')
    // No-op: DBOS shutdown is handled by DBOSExecutionWorker
  }

  /**
   * Get the number of pending tasks in the queue
   *
   * NOTE: This is optional in the ITaskQueue interface and not currently
   * implemented for DBOS. DBOS workflows are tracked in system tables,
   * but there's no simple API to count pending tasks.
   *
   * @returns 0 (not implemented)
   */
  async getPendingCount(): Promise<number> {
    // Not implemented - would require querying DBOS system tables
    return 0
  }

  /**
   * Close the queue and cleanup resources
   *
   * NOTE: This is handled by DBOSExecutionWorker.stop(). No cleanup needed
   * at the queue level.
   */
  async close(): Promise<void> {
    logger.info('DBOS task queue closed')
    // No-op: Cleanup handled by DBOSExecutionWorker
  }
}
