/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Pool } from 'pg'
import type { Subscriber } from 'pg-listen'
import type {
  PGListenerStats,
  StreamChannel,
  StreamIdentifier,
} from './types'

import { ExecutionEventImpl, MultiChannel } from '@badaitech/chaingraph-types'
import createSubscriber from 'pg-listen'
import { createLogger } from '../../../utils/logger'
import { POOL_CONFIG, STREAM_BATCH_CONFIG } from './types'

const logger = createLogger('pg-listener')

/**
 * Single PGListener with optimized DB reader loop
 *
 * Key optimizations:
 * - Single reader loop per stream (not per notification)
 * - Batch reads from database (1000 events/query)
 * - Non-blocking notification handler
 * - Graceful reference-counted cleanup
 */
export class PGListener {
  private readonly subscriber: Subscriber
  private readonly channels = new Map<string, StreamChannel>()
  private readonly queryPool: Pool
  private readonly listenerIndex: number
  private isConnected = false

  constructor(connectionString: string, queryPool: Pool, listenerIndex: number) {
    this.queryPool = queryPool
    this.listenerIndex = listenerIndex

    this.subscriber = createSubscriber(
      { connectionString },
      {
        paranoidChecking: POOL_CONFIG.HEALTH_CHECK_INTERVAL,
        retryTimeout: POOL_CONFIG.RETRY_TIMEOUT,
        retryLimit: POOL_CONFIG.RETRY_LIMIT,
      },
    )

    this.subscriber.events.on('error', (error) => {
      logger.error({ error: error.message, listenerIndex: this.listenerIndex }, 'PGListener error')
    })

    this.subscriber.events.on('connected', () => {
      this.isConnected = true
    })

    this.setupNotificationHandler()
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.subscriber.connect()
    }
  }

  /**
   * Subscribe to stream with reader loop initialization
   */
  async subscribe<T = any>(
    streamId: StreamIdentifier,
    fromOffset: number,
  ): Promise<MultiChannel<T[]>> {
    const streamKey = this.getStreamKey(streamId)
    const pgChannel = this.getPGChannelName(streamId)

    // Reuse existing channel
    const existing = this.channels.get(streamKey)
    if (existing) {
      existing.consumerCount++
      return existing.multiChannel as MultiChannel<T[]>
    }

    const multiChannel = new MultiChannel<T[]>()

    // Create channel state with offset tracking
    const channelState: StreamChannel<T> = {
      multiChannel,
      localOffset: fromOffset, // Start reading from here
      remoteOffset: fromOffset - 1, // Will be updated by notifications
      lastSentOffset: fromOffset - 1,
      consumerCount: 1,
      isReading: false,
      isPendingCatchup: true,
      isCleaningUp: false,
      createdAt: Date.now(),
    }

    this.channels.set(streamKey, channelState)

    // LISTEN to PostgreSQL
    await this.subscriber.listenTo(pgChannel)

    // Start reader loop immediately (don't wait for notification!)
    this.startReaderLoop(streamId, channelState)

    return multiChannel
  }

  /**
   * DB reader loop - reads batches until caught up
   */
  private async startReaderLoop(
    streamId: StreamIdentifier,
    channel: StreamChannel,
  ): Promise<void> {
    const streamKey = this.getStreamKey(streamId)

    if (channel.isReading) {
      return // Already running
    }

    channel.isReading = true
    const readerPromise = (async () => {
      try {
        // Initial catch-up
        while (channel.isReading && !channel.isCleaningUp) {
          const batch = await this.executeStreamQuery(
            streamId,
            channel.localOffset,
          )

          if (batch.length === 0) {
            // Caught up - wait for notifications
            channel.isPendingCatchup = false
            break
          }

          // Send to MultiChannel
          channel.multiChannel.send(batch)
          channel.localOffset += batch.length
          channel.lastSentOffset = channel.localOffset - 1
        }

        // Now wait for notifications to trigger more reads
        while (channel.isReading && !channel.isCleaningUp) {
          if (channel.localOffset <= channel.remoteOffset) {
            // New data available
            const batch = await this.executeStreamQuery(
              streamId,
              channel.localOffset,
            )

            if (batch.length > 0) {
              channel.multiChannel.send(batch)
              channel.localOffset += batch.length
              channel.lastSentOffset = channel.localOffset - 1
            } else {
              break // Caught up
            }
          } else {
            // No new data, wait
            await this.sleep(10)
          }
        }
      } catch (error) {
        logger.error({
          error: error instanceof Error ? error.message : String(error),
          streamKey,
        }, 'Reader loop error')
      } finally {
        channel.isReading = false
      }
    })()

    channel.readerPromise = readerPromise
  }

  /**
   * Notification handler - just updates remoteOffset
   */
  private setupNotificationHandler(): void {
    this.subscriber.events.on('notification', (notification) => {
      const streamId = this.parseChannelName(notification.channel)
      if (!streamId)
        return

      const streamKey = this.getStreamKey(streamId)
      const channel = this.channels.get(streamKey)
      if (!channel)
        return

      // Update remote offset
      channel.remoteOffset = Math.max(channel.remoteOffset, notification.payload.offset)

      // Trigger reader if not running
      if (!channel.isReading && channel.localOffset <= channel.remoteOffset) {
        this.startReaderLoop(streamId, channel)
      }
    })
  }

  /**
   * Graceful unsubscribe with reference counting
   */
  async unsubscribe(streamId: StreamIdentifier): Promise<void> {
    const streamKey = this.getStreamKey(streamId)
    const channel = this.channels.get(streamKey)

    if (!channel)
      return

    channel.consumerCount--

    logger.info({
      streamKey,
      remainingConsumers: channel.consumerCount,
    }, 'Consumer unsubscribed')

    // Cleanup if last consumer
    if (channel.consumerCount <= 0 && !channel.isCleaningUp) {
      channel.cleanupPromise = this.cleanupStream(streamId, channel)
      await channel.cleanupPromise
    }
  }

  /**
   * Graceful cleanup
   */
  private async cleanupStream(
    streamId: StreamIdentifier,
    channel: StreamChannel,
  ): Promise<void> {
    const streamKey = this.getStreamKey(streamId)
    channel.isCleaningUp = true

    // Stop reader
    channel.isReading = false

    // Wait for reader to finish
    if (channel.readerPromise) {
      await channel.readerPromise
    }

    // Close MultiChannel
    channel.multiChannel.close()

    // UNLISTEN
    const pgChannel = this.getPGChannelName(streamId)
    await this.subscriber.unlisten(pgChannel)

    // Clear maps
    this.channels.delete(streamKey)

    logger.info({ streamKey }, 'Stream cleaned up')
  }

  getStreamCount(): number {
    return this.channels.size
  }

  getStats(): PGListenerStats {
    const totalConsumers = Array.from(this.channels.values())
      .reduce((sum, ch) => sum + ch.consumerCount, 0)

    return {
      streamCount: this.channels.size,
      totalConsumers,
      listenerIndex: this.listenerIndex,
      isAtCapacity: this.channels.size >= POOL_CONFIG.MAX_STREAMS_PER_LISTENER,
    }
  }

  async close(): Promise<void> {
    for (const channel of this.channels.values()) {
      channel.multiChannel.close()
    }
    this.channels.clear()
    await this.subscriber.close()
  }

  /**
   * Execute database query
   */
  private async executeStreamQuery<T>(
    streamId: StreamIdentifier,
    startOffset: number,
  ): Promise<T[]> {
    const result = await this.queryPool.query<{
      offset: number
      value: string
    }>(`
      SELECT "offset", value
      FROM dbos.streams
      WHERE workflow_uuid = $1
        AND key = $2
        AND "offset" >= $3
      ORDER BY "offset" ASC
      LIMIT $4
    `, [
      streamId.workflowId,
      streamId.streamKey,
      startOffset,
      STREAM_BATCH_CONFIG.QUERY_BATCH_SIZE,
    ])

    const values: T[] = []

    for (const row of result.rows) {
      try {
        const parsed = JSON.parse(row.value)

        if (streamId.streamKey === 'events' && parsed.event) {
          const event = ExecutionEventImpl.deserializeStatic(parsed.event)
          if (event)
            values.push(event as T)
        } else {
          values.push(parsed)
        }
      } catch (error) {
        logger.warn({
          workflowId: streamId.workflowId,
          streamKey: streamId.streamKey,
          offset: row.offset,
        }, 'Parse error')
      }
    }

    return values
  }

  private parseChannelName(channel: string): StreamIdentifier | null {
    const prefix = 'dbos_stream_'
    if (!channel.startsWith(prefix))
      return null

    const parts = channel.slice(prefix.length).split('_')
    if (parts.length < 2)
      return null

    return {
      workflowId: parts[0],
      streamKey: parts.slice(1).join('_'),
    }
  }

  private getPGChannelName(streamId: StreamIdentifier): string {
    return `dbos_stream_${streamId.workflowId}_${streamId.streamKey}`
  }

  private getStreamKey(streamId: StreamIdentifier): string {
    return `${streamId.workflowId}:${streamId.streamKey}`
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
