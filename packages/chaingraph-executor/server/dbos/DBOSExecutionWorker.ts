/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionService } from '../services/ExecutionService'
import type { IExecutionStore } from '../stores/interfaces/IExecutionStore'
import type { DBOSWorkerOptions } from './types'
import { isDBOSLaunched } from '.'
import { createLogger } from '../utils/logger'
import { initializeDBOS, shutdownDBOS } from './config'
// Import queue to ensure it's created before DBOS.launch()
import { executionQueue, QUEUE_NAME } from './queue'
import {
  initializeExecuteFlowStep,
  initializeUpdateStatusSteps,
} from './steps'
// Import ExecutionWorkflows to ensure it's registered before DBOS.launch()
import { ExecutionWorkflows } from './workflows/ExecutionWorkflows'

const logger = createLogger('dbos-execution-worker')

/**
 * DBOS-based execution worker for chaingraph flows
 *
 * This worker replaces the Kafka-based ExecutionWorker with a DBOS-powered
 * implementation that provides:
 * - Durable execution with automatic recovery
 * - Exactly-once semantics through idempotency
 * - Built-in concurrency control
 * - PostgreSQL-backed queue (no Kafka needed for task distribution)
 *
 * Architecture:
 * ```
 * tRPC API → DBOSClient.enqueue() or DBOS.startWorkflow()
 *              ↓
 *          PostgreSQL (DBOS queue)
 *              ↓
 *          DBOS Worker (auto-consumes)
 *              ↓
 *          ExecutionWorkflows.executeChainGraph():
 *            1. Update status to "running"
 *            2. Execute flow atomically
 *            3. Update status to "completed"
 * ```
 *
 * Key Features:
 * - Uses class-based workflow with @DBOS.workflow() decorator
 * - Module-level queue created before DBOS.launch()
 * - No manual claim management (DBOS handles it)
 * - No manual recovery service (DBOS handles it)
 * - No manual offset commits (DBOS handles it)
 *
 * Usage:
 * ```typescript
 * const worker = new DBOSExecutionWorker(store, null, {
 *   concurrency: 100,
 *   workerConcurrency: 5
 * });
 *
 * await worker.start();
 * // Worker automatically processes queued executions
 * ```
 */
export class DBOSExecutionWorker {
  private isRunning = false

  /**
   * Create a new DBOS execution worker
   *
   * @param store Execution store for database operations
   * @param executionService Execution service for flow execution (optional, can be set via initializeExecuteFlowStep)
   * @param _options Worker configuration options (now ignored - config comes from queue.ts)
   */
  constructor(
    private readonly store: IExecutionStore,
    private executionService: ExecutionService | null,
    _options?: DBOSWorkerOptions,
  ) {
    // Verify ExecutionWorkflows is imported (prevents tree-shaking)
    if (!ExecutionWorkflows.executeChainGraph) {
      throw new Error('ExecutionWorkflows not properly imported - workflow may not be registered')
    }

    // Verify queue is created at module level
    if (!executionQueue) {
      throw new Error('Execution queue not created - check queue.ts import')
    }

    logger.debug({
      queueName: QUEUE_NAME,
      workflowRegistered: true,
    }, 'DBOS execution worker created')
  }

  /**
   * Start the DBOS execution worker
   *
   * This initializes DBOS, registers workflows and steps, and starts
   * processing queued executions automatically.
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('DBOS execution worker already running')
      return
    }

    logger.info('Starting DBOS execution worker...')

    try {
      // Step 1: Initialize DBOS runtime (if not already initialized)
      // This is idempotent - safe to call multiple times
      // ServiceFactory may have already initialized DBOS in API process
      if (!isDBOSLaunched()) {
        await initializeDBOS()
      } else {
        logger.debug('DBOS already initialized by ServiceFactory')
      }

      // Step 2: Initialize steps with dependencies
      // This injects dependencies into module-level state
      // Safe to call multiple times - updates the module-level references
      initializeUpdateStatusSteps(this.store)

      // Initialize execute flow step if executionService is provided
      // Otherwise, assume it was already initialized by ServiceFactory
      if (this.executionService) {
        initializeExecuteFlowStep(this.executionService, this.store)
      }

      // Step 3: Workflow is already registered via @DBOS.workflow() decorator
      // Queue was created at module level before DBOS.launch()
      // DBOS will automatically start consuming from the queue

      this.isRunning = true

      logger.info({
        queueName: QUEUE_NAME,
        workflowClass: 'ExecutionWorkflows',
        workflowMethod: 'executeChainGraph',
      }, 'DBOS execution worker started')

      // Note: Unlike Kafka workers, DBOS automatically processes queued workflows
      // We don't need to manually call consumeTasks() - DBOS handles it internally
    } catch (error) {
      logger.error({ error }, 'Failed to start DBOS execution worker')
      throw error
    }
  }

  /**
   * Stop the DBOS execution worker gracefully
   *
   * This shuts down DBOS, which will:
   * - Stop accepting new workflow executions
   * - Wait for in-progress workflows to complete (graceful)
   * - Close database connections
   * - Clean up resources
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.debug('DBOS execution worker not running')
      return
    }

    logger.info('Stopping DBOS execution worker...')

    try {
      await shutdownDBOS()
      this.isRunning = false
      logger.info('DBOS execution worker stopped successfully')
    } catch (error) {
      logger.error({ error }, 'Error stopping DBOS execution worker')
      throw error
    }
  }

  /**
   * Get the queue name
   *
   * @returns The queue name used by this worker
   */
  getQueueName(): string {
    return QUEUE_NAME
  }

  /**
   * Check if worker is running
   * @returns True if worker is running
   */
  isWorkerRunning(): boolean {
    return this.isRunning
  }
}
