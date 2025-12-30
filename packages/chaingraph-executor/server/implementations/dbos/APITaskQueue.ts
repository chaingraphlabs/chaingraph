/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { DBOSClient } from '@dbos-inc/dbos-sdk'
import type { Pool } from 'pg'
import type { ExecutionTask } from '../../../types'
import type { ITaskQueue } from '../../interfaces'
import { DBOSClient as DBOSClientClass } from '@dbos-inc/dbos-sdk'
import { DBOS_APPLICATION_VERSION, DBOS_QUEUE_NAME } from '../../dbos/version'
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
  private systemDatabasePool?: Pool

  constructor(systemDatabaseUrl: string, pgPool?: Pool) {
    this.systemDatabaseUrl = systemDatabaseUrl
    this.systemDatabasePool = pgPool
  }

  /**
   * Initialize the DBOS client (lazy initialization)
   */
  private async ensureClient(): Promise<DBOSClient> {
    if (!this.client) {
      // Log masked connection info (safe for production logs)
      logger.info({
        database: maskDatabaseUrl(this.systemDatabaseUrl),
      }, 'Initializing DBOSClient for API task queue')

      this.client = await DBOSClientClass.create({
        systemDatabaseUrl: this.systemDatabaseUrl,
        systemDatabasePool: this.systemDatabasePool,
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
          queueName: DBOS_QUEUE_NAME,
          workflowID: task.executionId, // Use executionId as workflow ID
          workflowTimeoutMS: 35 * 60 * 1000, // 35 minute timeout
          deduplicationID: task.executionId, // Prevent duplicates
          appVersion: DBOS_APPLICATION_VERSION, // CRITICAL: Must match worker version for dequeue
        },
        task, // Workflow argument
      )

      logger.info({
        executionId: task.executionId,
        flowId: task.flowId,
        flowVersion: task.flowVersion,
      }, 'Task enqueued via DBOSClient')
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

/**
 * Mask sensitive information in database URLs
 * Hides password and shows only essential connection info
 */
function maskDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url)
    // Keep only the protocol, host, port, and database name
    // Hide username and password
    const host = parsed.host
    const database = parsed.pathname
    return `postgres://*****@${host}${database}`
  } catch {
    return 'postgres://*****@hidden'
  }
}
