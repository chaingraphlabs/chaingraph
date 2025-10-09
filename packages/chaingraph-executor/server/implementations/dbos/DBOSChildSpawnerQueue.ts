/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionTask } from '../../../types'
import type { ITaskQueue, TaskConsumerContext } from '../../interfaces'
import { sendChildTaskToSpawner } from '../../dbos/workflows/ChildSpawnerWorkflow'
import { createLogger } from '../../utils/logger'

const logger = createLogger('dbos-child-spawner-queue')

/**
 * DBOS Child Spawner Queue - Special task queue for spawning child executions
 *
 * This queue uses DBOS messaging (DBOS.send) instead of DBOS.startWorkflow,
 * allowing child executions to be spawned from within steps (where startWorkflow is not allowed).
 *
 * Architecture:
 * - Parent execution (in step) calls publishTask()
 * - This sends message to 'child-spawner' workflow via DBOS.send()
 * - Child spawner workflow receives message and starts child workflow
 * - Child workflow runs independently
 *
 * Benefits:
 * - ⚡ Blazing fast: DBOS.send() is just a DB write (~1-2ms)
 * - 🚀 Non-blocking: Parent doesn't wait for child to start
 * - ✅ Allowed: DBOS.send() works from steps
 * - 💾 Durable: Messages stored in PostgreSQL
 * - 🔄 Reliable: Guaranteed delivery
 */
export class DBOSChildSpawnerQueue implements ITaskQueue {
  /**
   * Publish a task to the child spawner
   *
   * This sends the task to the child spawner workflow via DBOS.send(),
   * which is allowed from within steps.
   *
   * @param task The execution task to spawn
   */
  async publishTask(task: ExecutionTask): Promise<void> {
    logger.debug({
      executionId: task.executionId,
      flowId: task.flowId,
    }, 'Sending child task to spawner')

    try {
      // Send to child spawner workflow via DBOS messaging
      // This is allowed from steps and is blazing fast!
      await sendChildTaskToSpawner(task)

      logger.info({
        executionId: task.executionId,
        flowId: task.flowId,
      }, 'Child task sent to spawner successfully')
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        executionId: task.executionId,
      }, 'Failed to send child task to spawner')
      throw error
    }
  }

  /**
   * Consume tasks (not supported for child spawner)
   * Child spawning is handled by the dedicated spawner workflow
   */
  async consumeTasks(
    handler: (task: ExecutionTask, context?: TaskConsumerContext) => Promise<void>,
  ): Promise<void> {
    throw new Error('DBOSChildSpawnerQueue does not support consumeTasks - use ChildSpawnerWorkflow instead')
  }

  /**
   * Stop consuming tasks (no-op for child spawner)
   */
  async stopConsuming(): Promise<void> {
    logger.debug('Stop consuming called (no-op for child spawner)')
  }

  /**
   * Close the queue (no-op for child spawner)
   */
  async close(): Promise<void> {
    logger.debug('Close called (no-op for child spawner)')
  }
}
