/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionTask } from '../../../types'
import type { ExecutionResult } from '../types'
import { ExecutionEventEnum } from '@badaitech/chaingraph-types'
import { DBOS } from '@dbos-inc/dbos-sdk'
import SuperJSON from 'superjson'
import {
  executeFlowAtomic,
  updateToCompleted,
  updateToFailed,
  updateToRunning,
} from '../steps'
import { loadFlow } from '../../stores/flow-store'

/**
 * Main DBOS workflow for executing chaingraph flows
 *
 * This workflow orchestrates the execution of a chaingraph flow in three durable steps:
 * 1. Mark execution as "running" (checkpoint)
 * 2. Execute flow atomically: load + execute + stream events (checkpoint)
 * 3. Mark execution as "completed" (checkpoint)
 *
 * DBOS Durability Guarantees:
 * - Each step is checkpointed in PostgreSQL
 * - If the worker crashes, DBOS automatically resumes from the last completed step
 * - If Step 1 completes but Step 2 crashes, DBOS will retry Step 2 on another worker
 * - The workflow is guaranteed to run to completion (at-least-once semantics)
 * - Idempotency is ensured through workflow ID (executionId)
 *
 * Recovery Example:
 * ```
 * Time 0: Step 1 completes (status = running) ✓
 * Time 1: Step 2 starts (executing flow)
 * Time 2: Worker crashes 💥
 * Time 3: DBOS detects incomplete workflow
 * Time 4: DBOS retries Step 2 on another worker ↻
 * Time 5: Step 2 completes ✓
 * Time 6: Step 3 completes (status = completed) ✓
 * ```
 */

/**
 * Execute a chaingraph flow with durable workflow orchestration
 *
 * This is the main entry point for executing a chaingraph flow using DBOS.
 * The workflow provides exactly-once execution semantics through idempotency keys.
 *
 * @param task Execution task containing executionId and flowId
 * @returns Execution result with status and duration
 */
async function executeChainGraph(task: ExecutionTask): Promise<ExecutionResult> {
  DBOS.logger.info(`Starting execution workflow: ${task.executionId}`)

  try {
    // Step 1: Update status to "running"
    // This is the first durable checkpoint - marks that execution has started
    await DBOS.runStep(() => updateToRunning(task.executionId), {
      name: 'updateToRunning',
    })

    // Step 2: Execute flow ATOMICALLY
    // This is THE main step - includes:
    //   - Load flow from database
    //   - Initialize execution instance
    //   - Execute flow with real-time event streaming to Kafka
    //   - Wait for all events to be published
    //
    // If this step fails, DBOS will retry the ENTIRE step on another worker.
    // The flow execution is atomic - either fully succeeds or fully fails.
    const result = await DBOS.runStep(() => executeFlowAtomic(task), {
      name: 'executeFlowAtomic',
    })

    // Step 3: Update status to "completed"
    // This is the final durable checkpoint - marks successful completion
    await DBOS.runStep(() => updateToCompleted(task.executionId), {
      name: 'updateToCompleted',
    })

    DBOS.logger.info(`Execution workflow completed: ${task.executionId}`)
    return result
  } catch (error) {
    // Error handling: Update status to "failed"
    const errorMessage = error instanceof Error ? error.message : String(error)

    DBOS.logger.error(`Execution workflow failed: ${task.executionId} - ${errorMessage}`)

    // Update status to failed (this is also durable)
    await DBOS.runStep(() => updateToFailed(task.executionId, errorMessage), {
      name: 'updateToFailed',
    })

    // Re-throw to mark workflow as failed in DBOS
    throw error
  }
}

/**
 * Registered workflow - use this to start executions
 */
export const executionWorkflow = DBOS.registerWorkflow(executeChainGraph)
