/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Consumer, EachMessagePayload } from 'kafkajs'
import type { Buffer } from 'node:buffer'
import type { IncomingMessage } from 'node:http'
import type { Server } from 'node:http'
import type { ExecutionEventMessage } from '../types/messages'
import { createServer } from 'node:http'
import { ExecutionEventImpl } from '@badaitech/chaingraph-types'
import { safeSuperJSONParse, safeSuperJSONStringify } from 'server/utils/serialization'
import { WebSocket, WebSocketServer } from 'ws'
import { getKafkaClient } from '../kafka/client'
import { KafkaTopics } from '../types/messages'
import { config } from '../utils/config'
import { createLogger } from '../utils/logger'

const logger = createLogger('event-stream-service')

interface ClientSubscription {
  executionId: string
  client: WebSocket
  lastEventIndex?: number
}

export class EventStreamService {
  private server: Server | null = null
  private wss: WebSocketServer | null = null
  private consumer: Consumer | null = null
  private subscriptions: Map<string, Set<WebSocket>> = new Map()
  private clientSubscriptions: Map<WebSocket, ClientSubscription> = new Map()
  private isRunning = false

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Event stream service is already running')
      return
    }

    logger.info('Starting event stream service')

    // Create HTTP server
    this.server = createServer()

    // Create WebSocket server
    this.wss = new WebSocketServer({
      server: this.server,
      path: config.eventStream.wsPath,
    })

    // Handle WebSocket connections
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      this.handleConnection(ws, req)
    })

    // Start Kafka consumer
    await this.startKafkaConsumer()

    // Start HTTP server
    await new Promise<void>((resolve) => {
      this.server!.listen(config.eventStream.port, () => {
        logger.info({ port: config.eventStream.port }, 'Event stream server listening')
        resolve()
      })
    })

    this.isRunning = true
    logger.info('Event stream service started')
  }

  private async startKafkaConsumer(): Promise<void> {
    const kafka = getKafkaClient()
    this.consumer = kafka.consumer({
      groupId: config.kafka.groupId.stream,
      sessionTimeout: 10000, // Reduced from 30s to 10s
      heartbeatInterval: 3000,
      rebalanceTimeout: 10000, // Faster rebalancing
      maxWaitTimeInMs: 100, // Don't wait long for messages
    })

    await this.consumer.connect()
    await this.consumer.subscribe({
      topics: [KafkaTopics.EVENTS],
      fromBeginning: false,
    })

    await this.consumer.run({
      eachMessage: async (payload) => {
        try {
          await this.processEvent(payload)
        } catch (error) {
          logger.error({ error, topic: payload.topic }, 'Failed to process event')
        }
      },
    })

    logger.info('Kafka consumer started')
  }

  private handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const clientId = Math.random().toString(36).substring(7)
    logger.info({ clientId, url: req.url }, 'New WebSocket connection')

    ws.on('message', (data: Buffer) => {
      try {
        console.log('Received message:', data.toString())
        const message = safeSuperJSONParse(data.toString())
        this.handleClientMessage(ws, message)
      } catch (error) {
        logger.error({ error }, 'Failed to parse client message')
        ws.send(safeSuperJSONStringify({
          type: 'error',
          error: `Invalid message format: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }))
      }
    })

    ws.on('close', () => {
      this.handleDisconnection(ws)
    })

    ws.on('error', (error) => {
      logger.error({ error, clientId }, 'WebSocket error')
      this.handleDisconnection(ws)
    })

    // Send initial connection acknowledgment
    ws.send(safeSuperJSONStringify({
      type: 'connected',
      clientId,
    }))
  }

  private handleClientMessage(ws: WebSocket, message: any): void {
    switch (message.type) {
      case 'subscribe':
        this.handleSubscribe(ws, message.executionId)
        break
      case 'unsubscribe':
        this.handleUnsubscribe(ws, message.executionId)
        break
      case 'ping':
        ws.send(safeSuperJSONStringify({ type: 'pong' }))
        break
      default:
        logger.warn({ messageType: message.type }, 'Unknown message type')
        ws.send(safeSuperJSONStringify({
          type: 'error',
          error: 'Unknown message type',
        }))
    }
  }

  private handleSubscribe(ws: WebSocket, executionId: string): void {
    if (!executionId) {
      ws.send(safeSuperJSONStringify({
        type: 'error',
        error: 'Execution ID is required',
      }))
      return
    }

    // Add to subscription maps
    if (!this.subscriptions.has(executionId)) {
      this.subscriptions.set(executionId, new Set())
    }
    this.subscriptions.get(executionId)!.add(ws)

    this.clientSubscriptions.set(ws, {
      executionId,
      client: ws,
    })

    logger.info({ executionId }, 'Client subscribed to execution')

    ws.send(safeSuperJSONStringify({
      type: 'subscribed',
      executionId,
    }))
  }

  private handleUnsubscribe(ws: WebSocket, executionId: string): void {
    const clients = this.subscriptions.get(executionId)
    if (clients) {
      clients.delete(ws)
      if (clients.size === 0) {
        this.subscriptions.delete(executionId)
      }
    }

    this.clientSubscriptions.delete(ws)

    logger.info({ executionId }, 'Client unsubscribed from execution')

    ws.send(safeSuperJSONStringify({
      type: 'unsubscribed',
      executionId,
    }))
  }

  private handleDisconnection(ws: WebSocket): void {
    const subscription = this.clientSubscriptions.get(ws)
    if (subscription) {
      this.handleUnsubscribe(ws, subscription.executionId)
    }
    logger.info('Client disconnected')
  }

  private async processEvent(payload: EachMessagePayload): Promise<void> {
    const { message } = payload

    if (!message.value) {
      logger.warn('Received event with no value')
      return
    }

    // const superjson = getSuperJSONInstance()
    const parsedMessage = safeSuperJSONParse<ExecutionEventMessage>(message.value.toString())

    const messageEvent = ExecutionEventImpl.deserializeStatic(parsedMessage.event)

    const eventMessage: ExecutionEventMessage = {
      executionId: parsedMessage.executionId,
      timestamp: parsedMessage.timestamp,
      workerId: parsedMessage.workerId,
      event: messageEvent,
    }
    const { executionId, event } = eventMessage

    // Find subscribed clients
    const clients = this.subscriptions.get(executionId)
    if (!clients || clients.size === 0) {
      return
    }

    // Send event to all subscribed clients
    const eventData = safeSuperJSONStringify({
      type: 'event',
      executionId,
      event,
    })

    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(eventData)
      }
    }

    logger.debug({
      executionId,
      index: event.index,
      type: event.type,
      clientCount: clients.size,
    }, 'Event sent to clients')
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Event stream service is not running')
      return
    }

    logger.info('Stopping event stream service')
    this.isRunning = false

    // Close WebSocket connections
    if (this.wss) {
      for (const client of this.wss.clients) {
        client.close()
      }
      this.wss.close()
      this.wss = null
    }

    // Close HTTP server
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => resolve())
      })
      this.server = null
    }

    // Disconnect Kafka consumer
    if (this.consumer) {
      await this.consumer.disconnect()
      this.consumer = null
    }

    logger.info('Event stream service stopped')
  }
}
