/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  EventQueue,
  ExecutionEventImpl,
} from '@badaitech/chaingraph-types'
import type { ExecutionContext } from '@badaitech/chaingraph-types'
import type { Consumer } from 'kafkajs'
import type { ExecutionCommand, ExecutionInstance, ExecutionTask } from '../../types'
import type { IEventBus, ITaskQueue, TaskConsumerContext } from '../interfaces'
import type {
  FlowLoadMetric,
  TaskQueueMetric,
} from '../metrics'
import type { IExecutionStore } from '../stores/interfaces/IExecutionStore'
import process from 'node:process'
import {
  NodeRegistry,
} from '@badaitech/chaingraph-types'
import { customAlphabet } from 'nanoid'
import { nolookalikes } from 'nanoid-dictionary'
import { ExecutionStatus } from '../../types'
import { KafkaTopics } from '../../types/messages'
import { getKafkaClient } from '../kafka/client'
import {
  createMetricsTracker,
  LifecycleMetricsBuilder,
  MetricsHelper,
  MetricStages,
} from '../metrics'
import { ExecutionService } from '../services/ExecutionService'
import { loadFlow } from '../stores/flow-store'
import { config } from '../utils/config'
import { createLogger } from '../utils/logger'
import { safeSuperJSONParse } from '../utils/serialization'

const logger = createLogger('execution-worker')

/**
 * Refactored ExecutionWorker that uses the service interfaces
 * Works with both local and distributed modes
 */
export class ExecutionWorker {
  private isRunning = false
  private executionService: ExecutionService | null = null
  private commandConsumer: Consumer | null = null
  private activeExecutions: Map<string, {
    task: ExecutionTask
    instance: ExecutionInstance
    heartbeatInterval?: NodeJS.Timeout
  }> = new Map()

  private readonly workerId: string
  private readonly CLAIM_TIMEOUT_MS = config.worker.claimTimeoutMs
  private readonly HEARTBEAT_INTERVAL_MS = config.worker.heartbeatIntervalMs
  private reconnectAttempts = 0
  private readonly MAX_RECONNECT_ATTEMPTS = 10
  private readonly RECONNECT_DELAY_BASE = 1000 // 1 second base delay

  // Metrics tracking
  private readonly metrics = createMetricsTracker('execution-worker')
  private readonly metricsHelper = new MetricsHelper(this.metrics)
  private resourceMonitorInterval?: NodeJS.Timeout

  constructor(
    private readonly store: IExecutionStore,
    private readonly eventBus: IEventBus,
    private readonly taskQueue: ITaskQueue,
    private readonly nodeRegistry: NodeRegistry = NodeRegistry.getInstance(),
  ) {
    this.workerId = config.worker.id || `worker-${customAlphabet(nolookalikes, 8)()}`
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Worker is already running')
      return
    }

    // Create execution service with injected dependencies
    this.executionService = new ExecutionService(
      this.store,
      this.eventBus,
      this.taskQueue,
    )

    // Start command consumer if in distributed mode
    if (config.mode === 'distributed') {
      await this.startCommandConsumer()
    }

    // Periodically expire old claims
    setInterval(async () => {
      try {
        const expired = await this.store.expireOldClaims()
        if (expired > 0) {
          logger.debug({ count: expired }, 'Expired old claims')
        }
      } catch (error) {
        logger.error({ error }, 'Failed to expire old claims')
      }
    }, config.worker.claimExpirationCheckIntervalMs)

    // Start resource monitoring if metrics are enabled
    if (this.metrics.isEnabled && config.metrics?.includeMemoryMetrics) {
      this.resourceMonitorInterval = setInterval(() => {
        this.metricsHelper.trackResourceSnapshot(
          { executionId: 'worker', workerId: this.workerId },
          {
            memoryHeapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            memoryHeapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          },
        )
      }, 30000) // Every 30 seconds
    }

    this.isRunning = true

    // Start consuming tasks with context for manual offset management
    await this.taskQueue.consumeTasks(async (task, context) => {
      await this.processTask(task, context)
    })
  }

  private async processTask(task: ExecutionTask, context?: TaskConsumerContext): Promise<void> {
    const startProcessTime = Date.now()

    // Create lifecycle metrics builder
    const lifecycleBuilder = new LifecycleMetricsBuilder()

    // Calculate queue wait time (time from task creation to processing)
    const queueWaitTime = Date.now() - task.timestamp
    lifecycleBuilder.addPhase('queue_wait', queueWaitTime)

    // Create scoped metrics with execution context
    const scopedMetrics = this.metrics.withContext({
      executionId: task.executionId,
      flowId: task.flowId,
      workerId: this.workerId,
      retryCount: task.retryCount || 0,
    })

    // Initialize retry count if not set
    if (task.retryCount === undefined) {
      task.retryCount = 0
    }
    if (task.maxRetries === undefined) {
      task.maxRetries = 3
    }
    if (task.retryDelayMs === undefined) {
      task.retryDelayMs = 1000
    }

    const executionRow = await this.store.get(task.executionId)
    if (!executionRow) {
      logger.error({
        executionId: task.executionId,
        workerId: this.workerId,
      }, 'Execution not found in store, cannot process task')

      // Commit offset since this task is invalid and can't be processed
      if (context?.commitOffset) {
        await context.commitOffset()
        logger.debug({ executionId: task.executionId }, 'Committed offset for non-existent execution')
      }

      // TODO: dead letter queue for such tasks?
      return
    }

    // Check if execution is already completed or failed
    if (executionRow.status === 'completed' || executionRow.status === 'failed') {
      logger.info({
        executionId: task.executionId,
        status: executionRow.status,
        workerId: this.workerId,
      }, 'Execution already in terminal state, skipping')

      // Commit offset since this task doesn't need processing
      if (context?.commitOffset) {
        await context.commitOffset()
        logger.debug({ executionId: task.executionId }, 'Committed offset for already processed execution')
      }
      return
    }

    // Try to claim the execution with metrics
    lifecycleBuilder.startPhase('claim')
    const claimed = await scopedMetrics.trackOperation({
      execute: () => this.store.claimExecution(
        executionRow.id,
        this.workerId,
        this.CLAIM_TIMEOUT_MS,
      ),
      stage: MetricStages.CLAIM,
      event: 'attempt',
    })
    lifecycleBuilder.endPhase('claim')

    if (!claimed) {
      logger.debug({
        executionId: task.executionId,
        workerId: this.workerId,
        executionStatus: executionRow.status,
      }, 'Failed to claim execution, another worker got it or already executed')

      // Track claim conflict
      scopedMetrics.track({
        stage: MetricStages.CLAIM,
        event: 'conflict',
        timestamp: Date.now(),
      })

      // IMPORTANT: Commit offset even when claim fails
      // This prevents re-processing of tasks already being handled by another worker
      if (context?.commitOffset) {
        await context.commitOffset()
        logger.debug({ executionId: task.executionId }, 'Committed offset for unclaimed execution')
      }
      return
    }

    // IMPORTANT: Commit offset immediately after successful claim
    // This ensures the message won't be redelivered even if processing fails
    if (context?.commitOffset) {
      await context.commitOffset()
      logger.info({
        executionId: task.executionId,
        workerId: this.workerId,
        partition: context.partition,
        offset: context.offset,
      }, 'Committed Kafka offset after successful claim')
    }

    // Track successful claim
    scopedMetrics.track({
      stage: MetricStages.CLAIM,
      event: 'success',
      timestamp: Date.now(),
    })

    logger.info({
      executionId: task.executionId,
      flowId: task.flowId,
      workerId: this.workerId,
    }, 'Claimed and processing execution task')

    // Store active execution and start heartbeat
    const heartbeatInterval = setInterval(async () => {
      try {
        const extended = await scopedMetrics.trackOperation({
          execute: () => this.store.extendClaim(
            task.executionId,
            this.workerId,
            this.CLAIM_TIMEOUT_MS,
          ),
          stage: MetricStages.CLAIM,
          event: 'heartbeat',
          metadata: {
            heartbeat_interval_ms: this.HEARTBEAT_INTERVAL_MS,
          },
        })
        if (!extended) {
          logger.warn({
            executionId: task.executionId,
            workerId: this.workerId,
          }, 'Failed to extend claim, stopping execution')

          // Track heartbeat failure
          scopedMetrics.track({
            stage: MetricStages.CLAIM,
            event: 'heartbeat_failed',
            timestamp: Date.now(),
          })

          // TODO: Stop execution gracefully
          clearInterval(heartbeatInterval)
        }
      } catch (error) {
        logger.error({
          error,
          executionId: task.executionId,
        }, 'Error extending claim')

        // Track heartbeat error
        scopedMetrics.track({
          stage: MetricStages.CLAIM,
          event: 'heartbeat_error',
          timestamp: Date.now(),
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }, this.HEARTBEAT_INTERVAL_MS)

    try {
      // Load flow from database with metrics
      lifecycleBuilder.startPhase('flow_load')
      const { result: flow, cacheHit } = await this.metricsHelper.trackFlowLoad(
        task.flowId,
        { executionId: task.executionId, flowId: task.flowId, workerId: this.workerId },
        async () => await loadFlow(task.flowId),
        { cache: false, source: 'database' },
      )
      lifecycleBuilder.endPhase('flow_load')

      if (!flow) {
        throw new Error(`Flow ${task.flowId} not found`)
      }

      // Track flow characteristics
      scopedMetrics.track({
        stage: MetricStages.FLOW_LOAD,
        event: 'complete',
        timestamp: Date.now(),
        node_count: flow.nodes.size,
        edge_count: flow.edges.size,
      } as FlowLoadMetric)

      // Create execution instance with metrics
      lifecycleBuilder.startPhase('init')
      const abortController = new AbortController()
      const instance = await scopedMetrics.trackOperation({
        execute: () => this.executionService!.createExecutionInstance({
          task,
          flow,
          executionRow,
          abortController,
        }),
        stage: MetricStages.INIT,
        event: 'create_instance',
      })
      lifecycleBuilder.endPhase('init')

      this.activeExecutions.set(task.executionId, {
        task,
        instance,
        heartbeatInterval,
      })

      const startTime = Date.now()

      // Track status update
      lifecycleBuilder.startPhase('status_update')
      const runningStatusPromise = scopedMetrics.trackOperation({
        execute: () => this.setExecutionStatus(task.executionId, {
          status: ExecutionStatus.Running,
          startedAt: new Date(startTime),
        }),
        stage: MetricStages.DB_OPERATION,
        event: 'status_update_running',
      })
      lifecycleBuilder.endPhase('status_update')

      // Start execution phase
      lifecycleBuilder.startPhase('execution')
      await instance.engine!.execute(async (
        context: ExecutionContext,
        eventQueue: EventQueue<ExecutionEventImpl>,
      ) => {
        // execution complete callback
        // The eventQueue is already closed at this point, and all events should be processed
        // Clean up the event handling (wait for Kafka publishes to complete)
        lifecycleBuilder.startPhase('event_publish')
        if (instance.cleanupEventHandling) {
          await instance.cleanupEventHandling()
        }
        lifecycleBuilder.endPhase('event_publish')
      })
      lifecycleBuilder.endPhase('execution')

      const completeTime = Date.now()
      const executionTime = lifecycleBuilder.getBreakdown().execution || 0
      logger.info({
        executionId: task.executionId,
        executionTime,
        status: 'completed',
        workerId: this.workerId,
      }, 'Task execution completed')

      // Mark execution as completed in store if not already marked
      await runningStatusPromise

      lifecycleBuilder.startPhase('status_update')
      await scopedMetrics.trackOperation({
        execute: () => this.setExecutionStatus(task.executionId, {
          status: ExecutionStatus.Completed,
          completedAt: new Date(completeTime),
        }),
        stage: MetricStages.DB_OPERATION,
        event: 'status_update_completed',
      })
      lifecycleBuilder.endPhase('status_update')

      // Release claim and clean up
      lifecycleBuilder.startPhase('cleanup')
      await scopedMetrics.trackOperation({
        execute: () => this.releaseExecution(task.executionId),
        stage: MetricStages.CLAIM,
        event: 'release',
      })
      lifecycleBuilder.endPhase('cleanup')

      // Track complete lifecycle
      lifecycleBuilder.trackCompletion(scopedMetrics, {
        executionId: task.executionId,
        flowId: task.flowId,
        workerId: this.workerId,
        rootExecutionId: executionRow.rootExecutionId || undefined,
        parentExecutionId: executionRow.parentExecutionId || undefined,
        executionDepth: executionRow.executionDepth,
      })
    } catch (error) {
      const executionTime = Date.now() - startProcessTime

      // Track lifecycle failure
      lifecycleBuilder.trackFailure(
        scopedMetrics,
        {
          executionId: task.executionId,
          flowId: task.flowId,
          workerId: this.workerId,
          rootExecutionId: executionRow.rootExecutionId || undefined,
          parentExecutionId: executionRow.parentExecutionId || undefined,
          executionDepth: executionRow.executionDepth,
        },
        error instanceof Error ? error : String(error),
      )

      logger.error({
        error: error instanceof Error ? error.message : String(error),
        executionId: task.executionId,
        executionTime,
        workerId: this.workerId,
        retryCount: task.retryCount,
        maxRetries: task.maxRetries,
      }, 'Task execution failed')

      // Try to cleanup event handling even on error
      try {
        const activeExec = this.activeExecutions.get(task.executionId)
        if (activeExec?.instance.cleanupEventHandling) {
          await activeExec.instance.cleanupEventHandling()
          logger.debug({
            executionId: task.executionId,
          }, 'Event handling cleanup completed after error')
        }
      } catch (cleanupError) {
        logger.error({
          error: cleanupError,
          executionId: task.executionId,
        }, 'Failed to cleanup event handling after error')
      }

      // Release claim and clean up with metrics
      lifecycleBuilder.startPhase('cleanup')
      await scopedMetrics.trackOperation({
        execute: () => this.releaseExecution(task.executionId),
        stage: MetricStages.CLAIM,
        event: 'release_after_error',
      })
      lifecycleBuilder.endPhase('cleanup')

      // Check if we still own the claim before republishing
      const currentClaim = await this.store.getClaimForExecution(task.executionId)
      const stillClaimed = currentClaim?.workerId === this.workerId && currentClaim?.status === 'active'

      if (!stillClaimed) {
        logger.warn({
          executionId: task.executionId,
          workerId: this.workerId,
          claimStatus: currentClaim?.status,
          claimOwner: currentClaim?.workerId,
        }, 'Lost claim on execution, cannot retry')
        return
      }

      // Check if we should retry
      if (task.retryCount! < task.maxRetries!) {
        task.retryCount!++
        const retryDelay = task.retryDelayMs! * 2 ** (task.retryCount! - 1) // Exponential backoff

        // Track retry metrics
        scopedMetrics.track({
          stage: MetricStages.TASK_QUEUE,
          event: 'retry',
          timestamp: Date.now(),
          retry_count: task.retryCount,
          retry_delay_ms: retryDelay,
        } as TaskQueueMetric)

        // Add to retry history
        if (!task.retryHistory) {
          task.retryHistory = []
        }
        task.retryHistory.push({
          attempt: task.retryCount!,
          error: error instanceof Error ? error.message : String(error),
          timestamp: Date.now(),
          workerId: this.workerId,
        })

        logger.info({
          executionId: task.executionId,
          retryCount: task.retryCount,
          retryDelay,
          retryHistory: task.retryHistory,
        }, 'Scheduling task retry')

        // Update execution status to indicate retry
        await this.setExecutionStatus(task.executionId, {
          status: ExecutionStatus.Created, // Reset to created for retry
          errorMessage: `Retry ${task.retryCount}/${task.maxRetries}: ${error instanceof Error ? error.message : String(error)}`,
        })

        // Re-publish task with retry info
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        await this.taskQueue.publishTask(task)
      } else {
        // Max retries exceeded, mark as permanently failed
        try {
          await this.setExecutionStatus(task.executionId, {
            status: ExecutionStatus.Failed,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          })

          logger.error({
            executionId: task.executionId,
            retryCount: task.retryCount,
          }, 'Max retries exceeded, execution marked as failed')

          // TODO: Send to dead letter queue
        } catch (storeError) {
          logger.error({
            error: storeError,
            executionId: task.executionId,
          }, 'Failed to update execution status after error')
        }
      }
    }
  }

  private async setExecutionStatus(
    executionId: string,
    options: {
      status: ExecutionStatus
      errorMessage?: string
      errorNodeId?: string
      startedAt?: Date
      completedAt?: Date
    },
  ): Promise<void> {
    try {
      // Use the new atomic update method
      const success = await this.store.updateExecutionStatus({
        executionId,
        status: options.status,
        errorMessage: options.errorMessage,
        errorNodeId: options.errorNodeId,
        startedAt: options.startedAt,
        completedAt: options.completedAt,
      })

      if (!success) {
        logger.warn({
          executionId,
          status: options.status,
        }, 'Execution not found when updating status')
      }
    } catch (error) {
      logger.error({
        error,
        executionId,
        status: options.status,
      }, 'Error updating execution status in store')
    }
  }

  private async releaseExecution(executionId: string): Promise<void> {
    try {
      // Clear heartbeat interval
      const execution = this.activeExecutions.get(executionId)
      if (execution?.heartbeatInterval) {
        clearInterval(execution.heartbeatInterval)
      }
      this.activeExecutions.delete(executionId)

      // Release claim in database
      await this.store.releaseExecution(executionId, this.workerId)
    } catch (error) {
      logger.error({
        error,
        executionId,
        workerId: this.workerId,
      }, 'Error releasing execution claim')
    }
  }

  private async startCommandConsumer(): Promise<void> {
    try {
      const kafka = getKafkaClient()
      this.commandConsumer = kafka.consumer({
        groupId: `${config.kafka.groupId.worker}-commands-${this.workerId}`,
        sessionTimeout: 30000, // Increased from 10000 for better stability
        heartbeatInterval: 3000,
        // Ultra-low latency optimizations
        maxWaitTimeInMs: 1, // 1ms for ultra-low latency
        allowAutoTopicCreation: false,
      })

      await this.commandConsumer.connect()
      await this.commandConsumer.subscribe({
        topics: [KafkaTopics.COMMANDS],
        fromBeginning: false,
      })

      await this.commandConsumer.run({
        eachMessage: async ({ message }) => {
          if (!message.value)
            return

          try {
            const command: ExecutionCommand = safeSuperJSONParse(message.value.toString())
            await this.handleCommand(command)
          } catch (error) {
            logger.error({ error }, 'Failed to process command')
          }
        },
      })

      // Reset reconnect attempts on successful connection
      this.reconnectAttempts = 0
    } catch (error) {
      logger.error({ error, workerId: this.workerId }, 'Failed to start command consumer')
      await this.handleConnectionLoss()
    }
  }

  private async handleConnectionLoss(): Promise<void> {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      logger.error({
        workerId: this.workerId,
        attempts: this.reconnectAttempts,
      }, 'Max reconnection attempts reached, stopping worker')

      // Release all active executions before giving up
      for (const [executionId] of this.activeExecutions) {
        await this.releaseExecution(executionId)
      }

      await this.stop()
      return
    }

    this.reconnectAttempts++
    const delay = this.RECONNECT_DELAY_BASE * 2 ** Math.min(this.reconnectAttempts - 1, 5) // Exponential backoff with cap

    logger.info({
      workerId: this.workerId,
      attempt: this.reconnectAttempts,
      delay,
    }, 'Attempting to reconnect to Kafka')

    // Release all active executions before reconnecting
    for (const [executionId] of this.activeExecutions) {
      await this.releaseExecution(executionId)
    }

    // Disconnect existing consumer if any
    if (this.commandConsumer) {
      try {
        await this.commandConsumer.disconnect()
      } catch (error) {
        logger.error({ error }, 'Error disconnecting command consumer')
      }
      this.commandConsumer = null
    }

    // Wait before reconnecting
    await new Promise(resolve => setTimeout(resolve, delay))

    // Try to reconnect
    if (this.isRunning && config.mode === 'distributed') {
      try {
        await this.startCommandConsumer()
      } catch (error) {
        logger.error({ error }, 'Reconnection attempt failed')
      }
    }
  }

  private async handleCommand(command: ExecutionCommand): Promise<void> {
    // Only handle commands for executions we own
    if (!command.executionId) {
      logger.warn('Received command with no executionId, ignoring')
      return
    }

    // Always re-verify claim ownership before executing commands
    const claim = await this.store.getClaimForExecution(command.executionId)
    if (!claim || claim.workerId !== this.workerId || claim.status !== 'active') {
      logger.debug({
        command: command.command,
        executionId: command.executionId,
        claimWorkerId: claim?.workerId,
        ourWorkerId: this.workerId,
        claimStatus: claim?.status,
      }, 'Ignoring command - not our execution or claim not active')
      return
    }

    logger.debug({
      command: command.command,
      executionId: command.executionId,
      workerId: this.workerId,
    }, 'Handling command')

    const active = this.activeExecutions.get(command.executionId)
    if (!active) {
      logger.warn({
        executionId: command.executionId,
        workerId: this.workerId,
        command: command.command,
      }, 'No active execution instance found for command')
      return
    }

    switch (command.command) {
      case 'STOP':
        active.instance.context.abortController.abort('Execution stopped by external command')
        active.instance.engine?.getDebugger()?.stop()
        await this.setExecutionStatus(command.executionId, { status: ExecutionStatus.Stopped })
        await this.releaseExecution(command.executionId)
        break

      case 'PAUSE':
        active.instance.engine?.getDebugger()?.pause()
        await this.setExecutionStatus(command.executionId, { status: ExecutionStatus.Paused })
        break

      case 'START':
      case 'RESUME':
        active.instance.engine?.getDebugger()?.continue()
        await this.setExecutionStatus(command.executionId, { status: ExecutionStatus.Running })
        break

      case 'STEP':
        active.instance.engine?.getDebugger()?.step()
        break

      default:
        logger.warn({ command: command.command }, 'Unknown command type')
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Worker is not running')
      return
    }

    logger.info('Stopping execution worker')

    // Stop resource monitoring
    if (this.resourceMonitorInterval) {
      clearInterval(this.resourceMonitorInterval)
      this.resourceMonitorInterval = undefined
    }

    // Release all active executions
    for (const [executionId] of this.activeExecutions) {
      await this.releaseExecution(executionId)
    }

    // Stop command consumer
    if (this.commandConsumer) {
      await this.commandConsumer.disconnect()
      this.commandConsumer = null
    }

    // Stop consuming tasks
    await this.taskQueue.stopConsuming()

    // Dispose metrics tracker
    this.metrics.dispose()

    this.isRunning = false
    logger.info('Execution worker stopped')
  }
}
