/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

#!/usr/bin/env tsx
/*
 * Test script to demonstrate the full execution flow:
 * 1. Create an execution task
 * 2. Subscribe to execution events via WebSocket
 * 3. Send the task to Kafka
 * 4. Watch the execution progress
 */

import type { ExecutionEventData } from '@badaitech/chaingraph-types'
import type { Buffer } from 'node:buffer'
import type { ExecutionEventMessage, ExecutionTask } from '../server/types/messages'
import * as process from 'node:process'
import { ExecutionEventEnum } from '@badaitech/chaingraph-types'
import { Kafka } from 'kafkajs'
import { customAlphabet } from 'nanoid'
import { nolookalikes } from 'nanoid-dictionary'
import superjson from 'superjson'
import { WebSocket } from 'ws'
import {
  safeSuperJSONParse,
  safeSuperJSONStringify,
} from '../server/utils/serialization'

// Configuration
const KAFKA_BROKERS = ['localhost:9092', 'localhost:9093', 'localhost:9094']
const WS_URL = 'ws://localhost:4001/ws'
const FLOW_ID = process.argv[2] // Pass flow ID as argument

// Generate IDs
const generateExecutionID = () => `EX${customAlphabet(nolookalikes, 24)()}`
const generateCommandID = () => `CMD${customAlphabet(nolookalikes, 24)()}`

// Colors for console output
const colors = {
  reset: '\x1B[0m',
  bright: '\x1B[1m',
  dim: '\x1B[2m',
  red: '\x1B[31m',
  green: '\x1B[32m',
  yellow: '\x1B[33m',
  blue: '\x1B[34m',
  magenta: '\x1B[35m',
  cyan: '\x1B[36m',
}

function log(message: string, color = colors.reset) {
  console.log(`${color}${new Date().toISOString()} | ${message}${colors.reset}`)
}

async function connectWebSocket(executionId: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    log(`Connecting to WebSocket at ${WS_URL}...`, colors.cyan)
    const ws = new WebSocket(WS_URL)

    ws.on('open', () => {
      log('WebSocket connected', colors.green)

      // Subscribe to execution events
      ws.send(safeSuperJSONStringify({
        type: 'subscribe',
        executionId,
      }))
    })

    ws.on('message', (data: Buffer) => {
      // const message = JSON.parse(data.toString())
      const message = safeSuperJSONParse(data.toString())

      switch (message.type) {
        case 'connected':
          log(`Connected with client ID: ${message.clientId}`, colors.green)
          break

        case 'subscribed':
          log(`Subscribed to execution: ${message.executionId}`, colors.green)
          resolve(ws)
          break

        case 'event': {
          const event = message.event as ExecutionEventMessage['event']
          if (!event) {
            log('Received event message with no event data', colors.red)
            return
          }

          // Determine event type and color
          const eventType = event.type || 'UNKNOWN'
          const eventColor = getEventColor(eventType)
          log(`[EVENT] ${eventType}`, eventColor)

          // Log event details based on type
          if (event?.data) {
            const data = event.data

            switch (eventType) {
              case ExecutionEventEnum.NODE_STATUS_CHANGED: {
                const eventNodeStatusChanged = data as ExecutionEventData['node:status-changed']
                log(`  └─ Node: ${eventNodeStatusChanged.nodeId}`, colors.dim)
                log(`  └─ Status: ${eventNodeStatusChanged.oldStatus} → ${eventNodeStatusChanged.newStatus}`, colors.dim)
                break
              }
              case ExecutionEventEnum.NODE_STARTED: {
                const eventNodeStarted = data as ExecutionEventData['node:started']
                log(`  └─ Node: ${eventNodeStarted.node.metadata.title || eventNodeStarted.node?.id}`, colors.dim)
                break
              }

              case ExecutionEventEnum.NODE_COMPLETED: {
                const eventNodeStarted = data as ExecutionEventData['node:completed']
                log(`  └─ Node: ${eventNodeStarted.node?.metadata?.title || eventNodeStarted.node?.id}`, colors.dim)
                if (eventNodeStarted.executionTime) {
                  log(`  └─ Time: ${eventNodeStarted.executionTime}ms`, colors.dim)
                }
                break
              }

              case ExecutionEventEnum.NODE_FAILED: {
                const eventNodeFailed = data as ExecutionEventData['node:failed']
                log(`  └─ Node: ${eventNodeFailed.node?.metadata?.title || eventNodeFailed.node?.id}`, colors.red)
                log(`  └─ Error: ${eventNodeFailed.error?.message || 'Unknown error'}`, colors.red)
                break
              }

              case ExecutionEventEnum.FLOW_COMPLETED: {
                const eventFlowCompleted = data as ExecutionEventData['flow:completed']
                log(`  └─ Execution time: ${eventFlowCompleted.executionTime}ms`, colors.green)
                log('\n✅ Flow execution completed successfully!', colors.bright + colors.green)
                break
              }
              case ExecutionEventEnum.FLOW_STARTED: {
                const eventFlowStarted = data as ExecutionEventData['flow:started']
                log(`  └─ Flow: ${eventFlowStarted.flowMetadata.name || eventFlowStarted.flowMetadata.id}`, colors.dim)
                break
              }

              case ExecutionEventEnum.FLOW_FAILED: {
                const eventFlowFailed = data as ExecutionEventData['flow:failed']
                log(`  └─ Error: ${eventFlowFailed.error?.message || 'Unknown error'}`, colors.red)
                log('\n❌ Flow execution failed!', colors.bright + colors.red)
                break
              }

              case ExecutionEventEnum.NODE_DEBUG_LOG_STRING: {
                const eventNodeDebugLog = data as ExecutionEventData['node:debug-log-string']
                log(`  └─ Debug: ${eventNodeDebugLog.log}`, colors.yellow)
                break
              }

              case ExecutionEventEnum.CHILD_EXECUTION_SPAWNED: {
                const data = event.data as ExecutionEventData['child:spawned']
                log(`  └─ Child ID: ${data.childExecutionId}`, colors.magenta)
                log(`  └─ Event: ${data.eventName}`, colors.magenta)
                break
              }

              default:
                if (data) {
                  log(`  └─ Data: ${superjson.stringify(data).substring(0, 200)}`, colors.dim)
                }
            }
          }
          break
        }
        case 'error':
          log(`Error: ${message.error}`, colors.red)
          break

        default:
          log(`Unknown message type: ${message.type}`, colors.yellow)
      }
    })

    ws.on('error', (error) => {
      log(`WebSocket error: ${error.message}`, colors.red)
      reject(error)
    })

    ws.on('close', () => {
      log('WebSocket disconnected', colors.yellow)
    })
  })
}

function getEventColor(eventType: string): string {
  if (eventType.includes('FAILED') || eventType.includes('ERROR'))
    return colors.red
  if (eventType.includes('COMPLETED') || eventType.includes('SUCCESS'))
    return colors.green
  if (eventType.includes('STARTED') || eventType.includes('RUNNING'))
    return colors.blue
  if (eventType.includes('DEBUG') || eventType.includes('LOG'))
    return colors.yellow
  if (eventType.includes('CHILD') || eventType.includes('SPAWNED'))
    return colors.magenta
  return colors.cyan
}

async function sendExecutionTask(executionId: string, flowId: string) {
  log('Connecting to Kafka...', colors.cyan)

  const kafka = new Kafka({
    clientId: 'test-client',
    brokers: KAFKA_BROKERS,
  })

  const producer = kafka.producer()
  await producer.connect()
  log('Kafka producer connected', colors.green)

  const task: ExecutionTask = {
    executionId,
    flowId,
    context: {
      integrations: {},
      executionDepth: 0,
    },
    options: {
      maxConcurrency: 10,
      nodeTimeoutMs: 60000,
      flowTimeoutMs: 300000,
    },
    priority: 1,
    timestamp: Date.now(),
  }

  log(`Sending execution task for flow: ${flowId}`, colors.blue)
  log(`Execution ID: ${executionId}`, colors.blue)

  await producer.send({
    topic: 'chaingraph.execution.tasks',
    messages: [{
      key: executionId,
      value: safeSuperJSONStringify(task),
    }],
  })

  log('Execution task sent to Kafka', colors.green)
  await producer.disconnect()
}

async function main() {
  if (!FLOW_ID) {
    console.error(`
${colors.red}Error: Flow ID is required${colors.reset}

Usage: tsx test-execution.ts <flow-id>

Example: tsx test-execution.ts V2abc123def456ghi789jkl

You can find flow IDs in your database or by listing flows via the API.
`)
    process.exit(1)
  }

  log(`\n${colors.bright}=== Chaingraph Execution Test ===${colors.reset}\n`, colors.bright)

  const executionId = generateExecutionID()

  try {
    // Step 1: Connect to WebSocket and subscribe
    log('Step 1: Setting up event subscription', colors.bright)
    const wsStartTime = Date.now()
    const ws = await connectWebSocket(executionId)
    const wsTime = Date.now() - wsStartTime
    log(`WebSocket subscription ready (took ${wsTime}ms)`, colors.green)

    // Wait a bit to ensure subscription is ready
    // await new Promise(resolve => setTimeout(resolve, 1000))

    // Step 2: Send execution task to Kafka
    log('\nStep 2: Creating and sending execution task', colors.bright)
    const sendStartTime = Date.now()
    await sendExecutionTask(executionId, FLOW_ID)
    const sendTime = Date.now() - sendStartTime
    log(`Execution task sent (took ${sendTime}ms)`, colors.green)

    // Step 3: Monitor events

    log(`\n${colors.bright}=== Monitoring Execution Events ===${colors.reset}`)
    log('Waiting for execution events... (Press Ctrl+C to exit)\n')

    // Keep the process alive to receive events
    if (typeof process !== 'undefined' && process.on) {
      process.on('SIGINT', () => {
        log('\nShutting down...', colors.yellow)
        ws.close()
        process.exit(0)
      })
    } else {
      // Fallback for environments where process.on is not available
      log('Note: Signal handling not available in this environment', colors.dim)
    }
  } catch (error) {
    log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, colors.red)
    process.exit(1)
  }
}

// Run the test
main().catch((error) => {
  log(`Fatal error: ${error.message}`, colors.red)
  process.exit(1)
})
