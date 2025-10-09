/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { WorkflowHandle } from '@dbos-inc/dbos-sdk'
import type { ExecutionTask } from '../../../types'
import type { DBOSQueueOptions, ExecutionResult } from '../types'
import { DBOS, WorkflowQueue } from '@dbos-inc/dbos-sdk'
import { createLogger } from '../../utils/logger'
import { executionWorkflow } from '../workflows/ExecutionWorkflow'

const logger = createLogger('dbos-execution-queue')

/**
 * DBOS execution queue for managing chaingraph execution workflows
 *
 * This class wraps DBOS WorkflowQueue to provide a typed interface for enqueuing
 * and managing chaingraph executions. The queue is:
 * - Durable: Backed by PostgreSQL
 * - Distributed: Works across multiple workers
 * - Concurrent: Supports global and per-worker concurrency limits
 * - Reliable: Guarantees at-least-once execution
 *
 * Key Features:
 * - Global concurrency limit (across all workers)
 * - Per-worker concurrency limit (per process)
 * - FIFO ordering
 * - Idempotency through execution IDs
 * - Automatic retry on failure
 *
 * Example Usage:
 * ```typescript
 * const queue = new ExecutionQueue({ concurrency: 100, workerConcurrency: 5 });
 * const handle = await queue.enqueue(task);
 * const result = await handle.getResult();
 * ```
 */
export class ExecutionQueue {
  private queue: WorkflowQueue

  /**
   * Create a new execution queue
   *
   * @param options Queue configuration options
   * @param options.concurrency Global concurrency limit across all workers (default: 100)
   * @param options.workerConcurrency Per-worker concurrency limit (default: 5)
   */
  constructor(options?: DBOSQueueOptions) {
    const globalConcurrency = options?.concurrency ?? 100
    const perWorkerConcurrency = options?.workerConcurrency ?? 5

    this.queue = new WorkflowQueue('chaingraph-executions', {
      concurrency: globalConcurrency,
      workerConcurrency: perWorkerConcurrency,
    })

    logger.debug('Execution queue initialized')
  }

  /**
   * Enqueue an execution task for processing
   *
   * This method durably enqueues a chaingraph execution task. The execution
   * is guaranteed to eventually run even if the system crashes.
   *
   * Idempotency: Uses executionId as both the workflow ID and idempotency key,
   * ensuring that duplicate enqueue attempts for the same execution are safely ignored.
   *
   * Timeout: Executions have a 35-minute timeout to handle long-running workflows.
   *
   * @param task Execution task containing executionId and flowId
   * @returns Workflow handle for tracking execution status and result
   */
  async enqueue(task: ExecutionTask): Promise<WorkflowHandle<ExecutionResult>> {
    logger.debug({ executionId: task.executionId }, 'Enqueuing execution')

    try {
      const handle = await DBOS.startWorkflow(executionWorkflow, {
        queueName: this.queue.name,
        workflowID: task.executionId, // Use execution ID as workflow ID for easy tracking
        timeoutMS: 35 * 60 * 1000, // 35 minute timeout for long-running executions (capital S)
        enqueueOptions: {
          deduplicationID: task.executionId, // Prevent duplicate executions via deduplication
        },
      })(task)

      logger.debug({ executionId: task.executionId }, 'Execution enqueued')

      return handle
    } catch (error) {
      logger.error({
        error,
        executionId: task.executionId,
      }, 'Failed to enqueue execution')
      throw error
    }
  }

  /**
   * Retrieve workflow handle for an existing execution
   *
   * This allows you to reconnect to a running or completed workflow
   * and check its status or retrieve its result.
   *
   * @param executionId The execution ID (also used as workflow ID)
   * @returns Workflow handle or null if not found
   */
  async getHandle(executionId: string): Promise<WorkflowHandle<ExecutionResult> | null> {
    try {
      return DBOS.retrieveWorkflow<ExecutionResult>(executionId)
    } catch (error) {
      logger.debug({ executionId, error }, 'Workflow handle not found')
      return null
    }
  }

  /**
   * Get the current status of an execution workflow
   *
   * Possible statuses:
   * - PENDING: Queued but not yet started
   * - ENQUEUED: In queue waiting for worker capacity
   * - RUNNING: Currently executing
   * - SUCCESS: Completed successfully
   * - ERROR: Failed with error
   *
   * @param executionId The execution ID
   * @returns Status string or null if not found
   */
  async getStatus(executionId: string): Promise<string | null> {
    const handle = await this.getHandle(executionId)
    if (!handle) {
      return null
    }
    const status = await handle.getStatus()
    return status?.status ?? null
  }

  /**
   * Get the result of a completed execution
   *
   * This will wait for the execution to complete if it's still running.
   *
   * @param executionId The execution ID
   * @returns Execution result or null if not found
   */
  async getResult(executionId: string): Promise<ExecutionResult | null> {
    const handle = await this.getHandle(executionId)
    if (!handle) {
      return null
    }

    try {
      return await handle.getResult()
    } catch (error) {
      logger.error({ executionId, error }, 'Failed to get execution result')
      return null
    }
  }

  /**
   * Get the queue name
   * @returns The name of this queue
   */
  getQueueName(): string {
    return this.queue.name
  }
}
