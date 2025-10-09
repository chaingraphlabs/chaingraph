/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionTask } from '../../../types'
import { DBOS } from '@dbos-inc/dbos-sdk'
import { executionWorkflow } from './ExecutionWorkflow'

/**
 * Child Spawner Workflow - Dedicated workflow for spawning child executions
 *
 * This workflow runs continuously and receives child execution tasks via DBOS messaging.
 * It's responsible for starting child workflows, which allows parent executions (running in steps)
 * to spawn children without violating DBOS constraints.
 *
 * Architecture:
 * ```
 * Parent Execution (in step):
 *   → EventEmitter node executes
 *   → context.emitEvent('event-name', data)
 *   → ExecutionService.processEmittedEvents()
 *   → DBOS.send('child-spawner', childTask, 'CHILD_TASKS')  ⚡ Fast!
 *   → Parent continues execution (non-blocking)
 *
 * Child Spawner Workflow (separate workflow):
 *   → while(true):
 *       → childTask = DBOS.recv('CHILD_TASKS', timeout)
 *       → if (childTask):
 *           → DBOS.startWorkflow(executionWorkflow, {workflowID: childTask.executionId})(childTask)
 *           → Child workflow starts immediately
 * ```
 *
 * Benefits:
 * - ⚡ Blazing fast: DBOS.send() is just a DB write (~1-2ms)
 * - 🚀 Non-blocking: Parent doesn't wait for child to start
 * - ✅ Allowed: DBOS.send() works from steps
 * - 💾 Durable: Messages stored in PostgreSQL
 * - 🔄 Reliable: Guaranteed delivery
 * - 📈 Scalable: One spawner handles all child executions
 *
 * The spawner workflow ID is 'child-spawner' (singleton)
 */

const SPAWNER_WORKFLOW_ID = 'child-spawner'
const CHILD_TASKS_TOPIC = 'CHILD_TASKS'

/**
 * Child spawner workflow function
 *
 * This workflow runs continuously, receiving child execution tasks and starting them.
 * It uses DBOS.recv() with a timeout to wait for tasks, then starts child workflows.
 *
 * The workflow never completes - it runs indefinitely as a background service.
 * If the system restarts, DBOS automatically recovers this workflow and it resumes receiving tasks.
 */
async function childSpawner(): Promise<void> {
  DBOS.logger.info('Child spawner workflow started')

  let tasksProcessed = 0

  // Run forever, receiving and spawning child tasks
  while (true) {
    try {
      // Wait for a child task message
      // This blocks until a message arrives or timeout expires
      const childTask = await DBOS.recv<ExecutionTask>(CHILD_TASKS_TOPIC, 60 * 30)

      if (childTask) {
        DBOS.logger.info(`Spawning child execution: ${childTask.executionId}`)

        // Start child execution workflow
        // workflowID = executionId for consistent routing
        await DBOS.startWorkflow(executionWorkflow, {
          workflowID: childTask.executionId,
        })(childTask)

        tasksProcessed++

        DBOS.logger.info(`Child execution workflow started: ${childTask.executionId} (total: ${tasksProcessed})`)
      } else {
        // Timeout - no tasks received in the last 60 seconds
        // This is normal during idle periods
        DBOS.logger.debug('No child tasks received (timeout), continuing...')
      }
    } catch (error) {
      // Log error but continue running
      // The spawner should be resilient and not crash on individual task failures
      DBOS.logger.error(`Error spawning child execution (total: ${tasksProcessed}): ${error instanceof Error ? error.message : String(error)}`)

      // Small delay to prevent tight error loop
      await DBOS.sleep(1000)
    }
  }
}

/**
 * Registered child spawner workflow
 * This should be started once during system initialization
 */
export const childSpawnerWorkflow = DBOS.registerWorkflow(childSpawner)

/**
 * Helper function to send a child task to the spawner
 * This can be called from anywhere (including steps!)
 *
 * @param childTask The child execution task to spawn
 */
export async function sendChildTaskToSpawner(childTask: ExecutionTask): Promise<void> {
  await DBOS.send(SPAWNER_WORKFLOW_ID, childTask, CHILD_TASKS_TOPIC)
  DBOS.logger.debug(`Child task sent to spawner: ${childTask.executionId}`)
}

/**
 * Start the child spawner workflow
 * This should be called once during system initialization
 *
 * @returns The workflow handle
 */
export async function startChildSpawner() {
  const handle = await DBOS.startWorkflow(childSpawnerWorkflow, {
    workflowID: SPAWNER_WORKFLOW_ID,
  })()

  DBOS.logger.info('Child spawner workflow initialized (running in background)')

  return handle
}
