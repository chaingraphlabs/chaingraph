/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Flow, INode } from '@badaitech/chaingraph-types'
import type { ExecutionEventImpl } from '@badaitech/chaingraph-types'
import type { Consumer, EachMessagePayload } from 'kafkajs'
import type { ExecutionEventMessage, ExecutionTask } from '../types/messages'
import { NodeRegistry } from '@badaitech/chaingraph-types'
import { ExecutionContext, ExecutionEngine } from '@badaitech/chaingraph-types'
import { EventQueue } from '@badaitech/chaingraph-types'
import { customAlphabet } from 'nanoid'
import { nolookalikes } from 'nanoid-dictionary'
import { publishExecutionEvent } from 'server/kafka/producers/event-producer'
import { getKafkaClient } from '../kafka/client'
import { publishExecutionTask } from '../kafka/producers/task-producer'
import { getExecutionStore } from '../stores/execution-store'
import { loadFlow } from '../stores/flow-store'
import { KafkaTopics } from '../types/messages'
import { config } from '../utils/config'
import { createLogger } from '../utils/logger'
import { safeSuperJSONParse } from '../utils/serialization'

const logger = createLogger('execution-worker')

export class ExecutionWorker {
  private consumer: Consumer | null = null
  private isRunning = false
  private executionStore: any = null

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Worker is already running')
      return
    }

    logger.info({ workerId: config.worker.id }, 'Starting execution worker')

    // Initialize stores
    this.executionStore = await getExecutionStore(NodeRegistry.getInstance())

    // Create Kafka consumer with optimized settings
    const kafka = getKafkaClient()
    this.consumer = kafka.consumer({
      groupId: config.kafka.groupId.worker,
      sessionTimeout: 10000, // Reduced from 30s to 10s
      heartbeatInterval: 3000,
      rebalanceTimeout: 10000, // Faster rebalancing
      maxWaitTimeInMs: 100, // Don't wait long for messages
    })

    await this.consumer.connect()
    await this.consumer.subscribe({
      topics: [KafkaTopics.TASKS],
      fromBeginning: false,
    })

    this.isRunning = true

    // Start consuming messages
    await this.consumer.run({
      eachMessage: async (payload) => {
        try {
          await this.processMessage(payload)
        } catch (error) {
          logger.error({ error, topic: payload.topic }, 'Failed to process message')
        }
      },
    })

    logger.info('Execution worker started')
  }

  private async processMessage(payload: EachMessagePayload): Promise<void> {
    const { message } = payload

    if (!message.value) {
      logger.warn('Received message with no value')
      return
    }

    const task: ExecutionTask = safeSuperJSONParse(message.value.toString())
    logger.info({ executionId: task.executionId, flowId: task.flowId }, 'Processing execution task')

    await this.executeTask(task)
  }

  private async executeTask(task: ExecutionTask): Promise<void> {
    const startTime = Date.now()

    let executionFlow: Flow | null = null

    try {
      // 1. Load flow from database
      const flow = await loadFlow(task.flowId)
      if (!flow) {
        throw new Error(`Flow ${task.flowId} not found`)
      }

      // 2. Clone flow for execution
      executionFlow = await flow.clone() as Flow
      if (!executionFlow) {
        throw new Error(`Failed to clone flow ${task.flowId}`)
      }

      executionFlow.setIsDisabledPropagationEvents(true)

      // 3. Create execution context
      const abortController = new AbortController()
      const context = new ExecutionContext(
        task.flowId,
        abortController,
        undefined,
        task.executionId,
        task.context.integrations,
        task.context.parentExecutionId,
        task.context.eventData,
        !!task.context.parentExecutionId,
        task.context.executionDepth,
        (nodeId: string) => executionFlow!.nodes.get(nodeId),
        (predicate: (node: INode) => boolean) => {
          return Array.from(executionFlow!.nodes.values()).filter(predicate)
        },
      )

      // Enable event support
      if (!context.emittedEvents) {
        context.emittedEvents = []
      }

      // 4. Create execution engine
      const engine = new ExecutionEngine(executionFlow, context, {
        execution: task.options,
        debug: true,
      })

      // 5. Collect events to publish to Kafka
      // const pendingEventPublishes: Promise<void>[] = []

      /////////////////////
      const eventQueue = new EventQueue<ExecutionEventImpl>(1000)

      const unsubscribe = engine.onAll((event) => {
        // Publish event to queue for subscribers
        eventQueue.publish(event)
      })

      eventQueue.onClose(async () => {
        unsubscribe()
      })
      /////////////////////

      // engine.onAll(async (event) => {
      //   const eventMessage: ExecutionEventMessage = {
      //     executionId: task.executionId,
      //     event,
      //     timestamp: Date.now(),
      //     workerId: config.worker.id,
      //   }
      //
      //   // Track the promise but don't await here
      //   const publishPromise = publishExecutionEvent(eventMessage).catch((error) => {
      //     logger.error({
      //       error,
      //       executionId: task.executionId,
      //       eventType: event.type,
      //       eventIndex: event.index,
      //     }, 'Failed to publish event to Kafka')
      //   })
      //
      //   pendingEventPublishes.push(publishPromise)
      // })

      // 6. Execute flow
      logger.info({ executionId: task.executionId }, 'Starting flow execution')
      engine.execute().finally(async () => {
        eventQueue.close()
      }).catch((error) => {
        logger.error({ error, executionId: task.executionId }, 'Flow execution error')
      }).then(async () => {
        // After execution, process any emitted events
        logger.info({ executionId: task.executionId }, 'Execution finished, processing emitted events')
      })

      const iterator = eventQueue.createIterator()
      // iterate on eventQueue:
      for await (const event of iterator) {
        // send events to the kafka topic
        const eventMessage: ExecutionEventMessage = {
          executionId: task.executionId,
          event,
          timestamp: Date.now(),
          workerId: config.worker.id,
        }

        await publishExecutionEvent(eventMessage).catch((error) => {
          logger.error({
            error,
            executionId: task.executionId,
            eventType: event.type,
            eventIndex: event.index,
          }, 'Failed to publish event to Kafka')
        })
      }

      const executionTime = Date.now() - startTime
      logger.info({
        executionId: task.executionId,
        executionTime,
      }, 'Flow execution completed')
    } catch (error) {
      const executionTime = Date.now() - startTime
      logger.error({
        error,
        executionId: task.executionId,
        executionTime,
      }, 'Flow execution failed')

      // Publish failure event
      // TODO: check if we really need to publish this here, as the engine should handle it
      // await publishExecutionEvent({
      //   executionId: task.executionId,
      //   event: new ExecutionEventImpl(
      //     0,
      //     ExecutionEventEnum.FLOW_FAILED,
      //     new Date(),
      //     {
      //       flow: executionFlow as IFlow,
      //       error: error instanceof Error ? error : new Error('Unknown error'),
      //       executionTime,
      //     },
      //   ),
      //   timestamp: Date.now(),
      //   workerId: config.worker.id,
      // })
    }
  }

  private async processEmittedEvents(task: ExecutionTask, context: ExecutionContext): Promise<void> {
    if (!context.emittedEvents || context.emittedEvents.length === 0) {
      return
    }

    const unprocessedEvents = context.emittedEvents.filter(e => !e.processed)

    for (const event of unprocessedEvents) {
      // Create child execution task
      const childTask: ExecutionTask = {
        executionId: `EX${customAlphabet(nolookalikes, 24)()}`,
        flowId: task.flowId,
        context: {
          integrations: task.context.integrations,
          parentExecutionId: task.executionId,
          eventData: {
            eventName: event.type,
            payload: event.data,
            emittedBy: event.emittedBy,
          },
          executionDepth: task.context.executionDepth + 1,
        },
        options: task.options,
        priority: task.priority,
        timestamp: Date.now(),
      }

      // Check depth limit
      if (childTask.context.executionDepth > 100) {
        logger.warn({
          parentExecutionId: task.executionId,
          depth: childTask.context.executionDepth,
        }, 'Maximum execution depth exceeded, skipping child execution')
        continue
      }

      // Publish child task to Kafka
      await publishExecutionTask(childTask)
      event.processed = true
      event.childExecutionId = childTask.executionId

      logger.info({
        parentExecutionId: task.executionId,
        childExecutionId: childTask.executionId,
        eventType: event.type,
      }, 'Child execution spawned')
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Worker is not running')
      return
    }

    logger.info('Stopping execution worker')
    this.isRunning = false

    if (this.consumer) {
      await this.consumer.disconnect()
      this.consumer = null
    }

    logger.info('Execution worker stopped')
  }
}
