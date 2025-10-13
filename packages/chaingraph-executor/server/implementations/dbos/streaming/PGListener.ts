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
  StreamDeserializer,
  StreamIdentifier,
} from './types'

import { MultiChannel } from '@badaitech/chaingraph-types'
import createSubscriber from 'pg-listen'
import { createLogger } from '../../../utils/logger'
import { POOL_CONFIG, STREAM_BATCH_CONFIG, STREAM_CONSTANTS } from './types'

const logger = createLogger('pg-listener')

/**
 * PGListener with reactive event-driven architecture
 *
 * Features:
 * - Zero-sleep reactive wake-up
 * - Single reader loop per stream
 * - Batch reads (1000 events/query)
 * - Error recovery with retry
 * - Pluggable deserializers
 */
export class PGListener {
  private readonly subscriber: Subscriber
  private readonly channels = new Map<string, StreamChannel>()
  private readonly queryPool: Pool
  private readonly listenerIndex: number
  private readonly deserializers = new Map<string, StreamDeserializer<any>>()
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

  /**
   * Register deserializer for stream key
   */
  registerDeserializer<T>(streamKey: string, deserializer: StreamDeserializer<T>): void {
    this.deserializers.set(streamKey, deserializer)
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.subscriber.connect()
    }
  }

  async subscribe<T = any>(
    streamId: StreamIdentifier,
    fromOffset: number,
  ): Promise<MultiChannel<T[]>> {
    const streamKey = this.getStreamKey(streamId)
    const pgChannel = this.getPGChannelName(streamId)

    const existing = this.channels.get(streamKey)
    if (existing) {
      existing.consumerCount++
      return existing.multiChannel as MultiChannel<T[]>
    }

    const multiChannel = new MultiChannel<T[]>()

    const channelState: StreamChannel<T> = {
      multiChannel,
      localOffset: fromOffset,
      remoteOffset: fromOffset - 1,
      lastSentOffset: fromOffset - 1,
      consumerCount: 1,
      isReading: false,
      isPendingCatchup: true,
      wakeUpResolver: null,
      isCleaningUp: false,
      createdAt: Date.now(),
    }

    this.channels.set(streamKey, channelState)

    await this.subscriber.listenTo(pgChannel)

    // Start reader loop immediately
    channelState.readerPromise = this.startReaderLoop(streamId, channelState)

    return multiChannel
  }

  /**
   * DB reader loop - reactive, zero-sleep
   */
  private async startReaderLoop(
    streamId: StreamIdentifier,
    channel: StreamChannel,
  ): Promise<void> {
    if (channel.isReading)
      return

    channel.isReading = true
    let retryCount = 0
    const MAX_RETRIES = 3

    try {
      // Initial catch-up
      while (channel.isReading && !channel.isCleaningUp) {
        try {
          const batch = await this.executeStreamQuery(streamId, channel.localOffset)

          if (batch.length === 0) {
            channel.isPendingCatchup = false
            break
          }

          channel.multiChannel.send(batch)
          channel.localOffset += batch.length
          channel.lastSentOffset = channel.localOffset - 1
          retryCount = 0 // Reset on success
        } catch (error) {
          retryCount++
          if (retryCount >= MAX_RETRIES) {
            throw error
          }
          logger.warn({ retryCount, error: error instanceof Error ? error.message : String(error) }, 'Query error, retrying')
          await this.waitForWakeUp(channel, 1000) // Brief backoff
        }
      }

      // Reactive loop - wait for notifications
      while (channel.isReading && !channel.isCleaningUp) {
        if (channel.localOffset <= channel.remoteOffset) {
          try {
            const batch = await this.executeStreamQuery(streamId, channel.localOffset)

            if (batch.length > 0) {
              channel.multiChannel.send(batch)
              channel.localOffset += batch.length
              channel.lastSentOffset = channel.localOffset - 1
              retryCount = 0
            } else {
              // Caught up
              await this.waitForWakeUp(channel)
            }
          } catch (error) {
            retryCount++
            if (retryCount >= MAX_RETRIES) {
              throw error
            }
            logger.warn({ retryCount }, 'Query error, retrying')
            await this.waitForWakeUp(channel, 1000)
          }
        } else {
          // No new data - wait for notification
          await this.waitForWakeUp(channel)
        }
      }
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Reader loop failed')
      channel.multiChannel.setError(error instanceof Error ? error : new Error(String(error)))
    } finally {
      channel.isReading = false
    }
  }

  /**
   * Reactive wait - wakes up when notification arrives
   */
  private waitForWakeUp(channel: StreamChannel, timeoutMs?: number): Promise<void> {
    return new Promise((resolve) => {
      channel.wakeUpResolver = resolve

      if (timeoutMs) {
        setTimeout(() => {
          if (channel.wakeUpResolver === resolve) {
            channel.wakeUpResolver = null
            resolve()
          }
        }, timeoutMs)
      }
    })
  }

  /**
   * Wake up reader (called by notification handler or cleanup)
   */
  private wakeUpReader(channel: StreamChannel): void {
    if (channel.wakeUpResolver) {
      channel.wakeUpResolver()
      channel.wakeUpResolver = null
    }
  }

  /**
   * Notification handler - updates offset and wakes reader
   */
  private setupNotificationHandler(): void {
    this.subscriber.events.on('notification', (notification) => {
      try {
        const streamId = this.parseChannelName(notification.channel)
        if (!streamId)
          return

        const streamKey = this.getStreamKey(streamId)
        const channel = this.channels.get(streamKey)
        if (!channel)
          return

        // Update remote offset
        channel.remoteOffset = Math.max(channel.remoteOffset, notification.payload.offset)

        // Wake up reader (reactive!)
        this.wakeUpReader(channel)

        // Start reader if stopped
        if (!channel.isReading && channel.localOffset <= channel.remoteOffset) {
          channel.readerPromise = this.startReaderLoop(streamId, channel)
        }
      } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Notification handler error')
      }
    })
  }

  async unsubscribe(streamId: StreamIdentifier): Promise<void> {
    const streamKey = this.getStreamKey(streamId)
    const channel = this.channels.get(streamKey)

    if (!channel)
      return

    channel.consumerCount--

    if (channel.consumerCount <= 0 && !channel.isCleaningUp) {
      channel.cleanupPromise = this.cleanupStream(streamId, channel)
      await channel.cleanupPromise
    }
  }

  private async cleanupStream(
    streamId: StreamIdentifier,
    channel: StreamChannel,
  ): Promise<void> {
    channel.isCleaningUp = true
    channel.isReading = false

    // Wake up reader to exit
    this.wakeUpReader(channel)

    // Wait for reader
    if (channel.readerPromise) {
      await channel.readerPromise
    }

    channel.multiChannel.close()

    const pgChannel = this.getPGChannelName(streamId)
    await this.subscriber.unlisten(pgChannel)

    this.channels.delete(this.getStreamKey(streamId))
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
      channel.isReading = false
      this.wakeUpReader(channel)
      channel.multiChannel.close()
    }
    this.channels.clear()
    await this.subscriber.close()
  }

  /**
   * Execute query with deserializer
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
    const deserializer = this.deserializers.get(streamId.streamKey)

    for (const row of result.rows) {
      try {
        const parsed = JSON.parse(row.value)

        if (deserializer) {
          const value = deserializer(parsed)
          if (value)
            values.push(value)
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
    if (!channel.startsWith(STREAM_CONSTANTS.CHANNEL_PREFIX))
      return null

    const suffix = channel.slice(STREAM_CONSTANTS.CHANNEL_PREFIX.length)
    const parts = suffix.split('_')
    if (parts.length < 2)
      return null

    return {
      workflowId: parts[0],
      streamKey: parts.slice(1).join('_'),
    }
  }

  private getPGChannelName(streamId: StreamIdentifier): string {
    return `${STREAM_CONSTANTS.CHANNEL_PREFIX}${streamId.workflowId}_${streamId.streamKey}`
  }

  private getStreamKey(streamId: StreamIdentifier): string {
    return `${streamId.workflowId}:${streamId.streamKey}`
  }
}
