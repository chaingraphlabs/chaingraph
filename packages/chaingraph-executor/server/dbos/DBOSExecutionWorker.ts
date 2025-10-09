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
import { ExecutionQueue } from './queues/ExecutionQueue'
import {
  initializeExecuteFlowStep,
  initializeUpdateStatusSteps,
} from './steps'

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
 * tRPC API → queue.enqueue(task)
 *              ↓
 *          PostgreSQL (DBOS queue)
 *              ↓
 *          DBOS Worker (auto-consumes)
 *              ↓
 *          ExecutionWorkflow:
 *            1. Update status to "running"
 *            2. Execute flow atomically
 *            3. Update status to "completed"
 * ```
 *
 * Key Differences from Kafka Worker:
 * - No manual claim management (DBOS handles it)
 * - No manual recovery service (DBOS handles it)
 * - No manual offset commits (DBOS handles it)
 * - Simpler code (~500 lines removed)
 *
 * Usage:
 * ```typescript
 * const worker = new DBOSExecutionWorker(store, eventBus, taskQueue, {
 *   concurrency: 100,
 *   workerConcurrency: 5
 * });
 *
 * await worker.start();
 * // Worker automatically processes queued executions
 * ```
 */
export class DBOSExecutionWorker {
  private queue: ExecutionQueue
  // private executionService: ExecutionService
  private isRunning = false

  /**
   * Create a new DBOS execution worker
   *
   * @param store Execution store for database operations
   * @param executionService Execution service for flow execution (optional, can be set via initializeExecuteFlowStep)
   * @param options Worker configuration options
   */
  constructor(
    private readonly store: IExecutionStore,
    private executionService: ExecutionService | null,
    options?: DBOSWorkerOptions,
  ) {
    this.queue = new ExecutionQueue({
      concurrency: options?.concurrency ?? 100,
      workerConcurrency: options?.workerConcurrency ?? 5,
    })
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

      // Step 3: Workflow is already registered in ExecutionWorkflow.ts
      // In DBOS v4, workflows are registered at module load time via DBOS.registerWorkflow()
      // Steps don't need registration - they're just regular functions called via DBOS.runStep()

      this.isRunning = true

      logger.info({
        queueName: this.queue.getQueueName(),
      }, 'DBOS execution worker started successfully - listening for queued tasks')

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
   * Get the execution queue
   *
   * This allows external code (e.g., tRPC API) to enqueue executions
   *
   * @returns The execution queue instance
   */
  getQueue(): ExecutionQueue {
    return this.queue
  }

  /**
   * Check if worker is running
   * @returns True if worker is running
   */
  isWorkerRunning(): boolean {
    return this.isRunning
  }
}
