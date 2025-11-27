/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { DBOSClient } from '@dbos-inc/dbos-sdk'
import type { ExecutionTask } from '../../../types'
import type { ITaskQueue } from '../../interfaces'
import { DBOSClient as DBOSClientClass } from '@dbos-inc/dbos-sdk'
import { createLogger } from '../../utils/logger'

const logger = createLogger('api-task-queue')

/**
 * API-only task queue that uses DBOSClient to enqueue workflows
 * without launching the full DBOS runtime.
 *
 * This ensures the API cannot execute workflows - it only enqueues them.
 * Uses the official DBOS Client API for external applications.
 *
 * Key differences from DBOSTaskQueue:
 * - Uses DBOSClient.enqueue() instead of DBOS.startWorkflow()
 * - No DBOS runtime initialization required
 * - Cannot execute workflows locally
 * - Suitable for API servers that only need to submit tasks
 */
export class APITaskQueue implements ITaskQueue {
  private client: DBOSClient | null = null
  private systemDatabaseUrl: string

  constructor(systemDatabaseUrl: string) {
    this.systemDatabaseUrl = systemDatabaseUrl
  }

  /**
   * Initialize the DBOS client (lazy initialization)
   */
  private async ensureClient(): Promise<DBOSClient> {
    if (!this.client) {
      this.client = await DBOSClientClass.create({
        systemDatabaseUrl: this.systemDatabaseUrl,
      })
      logger.info('DBOSClient initialized for API task queue')
    }
    return this.client
  }

  /**
   * Publish a task to the DBOS queue via DBOSClient
   *
   * This enqueues the workflow without executing it locally.
   * The workflow will be picked up by a DBOS worker process.
   */
  async publishTask(task: ExecutionTask): Promise<void> {
    const client = await this.ensureClient()

    try {
      // Use DBOSClient.enqueue() with explicit workflow metadata
      // Since ExecutionWorkflows uses static methods with @DBOS.workflow() decorator,
      // it's registered as a class-based workflow
      await client.enqueue(
        {
          workflowName: 'executeChainGraph', // Method name from ExecutionWorkflows class
          workflowClassName: 'ExecutionWorkflows', // Class name for class-based workflows
          queueName: 'chaingraph-executions',
          workflowID: task.executionId, // Use executionId as workflow ID
          workflowTimeoutMS: 35 * 60 * 1000, // 35 minute timeout
          deduplicationID: task.executionId, // Prevent duplicates
        },
        task, // Workflow argument
      )

      logger.info({ executionId: task.executionId }, 'Task enqueued via DBOSClient')
    } catch (error) {
      logger.error({ error, executionId: task.executionId }, 'Failed to enqueue task')
      throw error
    }
  }

  /**
   * Get the DBOSClient instance (for passing to tRPC context)
   *
   * This allows the tRPC router to use the same client for sending signals
   * and cancelling workflows.
   */
  async getClient(): Promise<DBOSClient> {
    return this.ensureClient()
  }

  /**
   * Close the DBOS client and clean up resources
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.destroy()
      this.client = null
      logger.info('DBOSClient destroyed')
    }
  }

  /**
   * Consume tasks from the queue
   * Not supported in API mode - this is a no-op
   */
  async consumeTasks(): Promise<void> {
    // API mode does not consume tasks - only enqueues them
    logger.warn('consumeTasks called on APITaskQueue - this is a no-op in API mode')
  }

  /**
   * Stop consuming tasks
   * Not supported in API mode - this is a no-op
   */
  async stopConsuming(): Promise<void> {
    // API mode does not consume tasks - nothing to stop
    logger.debug('stopConsuming called on APITaskQueue - this is a no-op in API mode')
  }
}
