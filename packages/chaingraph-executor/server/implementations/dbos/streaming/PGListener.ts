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
  StreamNotificationPayload,
} from './types'

import { ExecutionEventImpl, MultiChannel } from '@badaitech/chaingraph-types'
import createSubscriber from 'pg-listen'
import { createLogger } from '../../../utils/logger'
import { POOL_CONFIG, STREAM_BATCH_CONFIG } from './types'

const logger = createLogger('pg-listener')

/**
 * Single PGListener instance managing one pg-listen subscriber
 *
 * Features:
 * - One pg-listen connection with auto-reconnect
 * - Multiple LISTEN channels on same connection
 * - MultiChannel per stream for fan-out to multiple consumers
 * - Atomic subscription with no lost events
 * - Query deduplication per listener
 */
export class PGListener {
  /** pg-listen subscriber instance */
  private readonly subscriber: Subscriber

  /** Active stream channels by streamKey */
  private readonly channels = new Map<string, StreamChannel>()

  /** Pending queries to prevent duplicate fetches */
  private readonly pendingQueries = new Map<string, Promise<any[]>>()

  /** PostgreSQL pool for database queries */
  private readonly queryPool: Pool

  /** Listener index in pool */
  private readonly listenerIndex: number

  /** Whether subscriber is connected */
  private isConnected = false

  constructor(connectionString: string, queryPool: Pool, listenerIndex: number) {
    this.queryPool = queryPool
    this.listenerIndex = listenerIndex

    // Create pg-listen subscriber with health checks
    // First arg: connection config, second arg: options
    this.subscriber = createSubscriber(
      { connectionString },
      {
        paranoidChecking: POOL_CONFIG.HEALTH_CHECK_INTERVAL,
        retryTimeout: POOL_CONFIG.RETRY_TIMEOUT,
        retryLimit: POOL_CONFIG.RETRY_LIMIT,
      },
    )

    // Setup event handlers
    this.subscriber.events.on('error', (error) => {
      logger.error({
        error: error.message,
        listenerIndex: this.listenerIndex,
      }, 'PGListener error')
    })

    this.subscriber.events.on('reconnect', (attempt) => {
      logger.warn({
        attempt,
        listenerIndex: this.listenerIndex,
      }, 'PGListener reconnecting')
    })

    this.subscriber.events.on('connected', () => {
      logger.info({
        listenerIndex: this.listenerIndex,
      }, 'PGListener connected')
      this.isConnected = true
    })

    // Setup global notification handler
    this.setupNotificationHandler()

    logger.debug({
      listenerIndex: this.listenerIndex,
    }, 'PGListener created')
  }

  /**
   * Connect to PostgreSQL
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return
    }

    await this.subscriber.connect()
    logger.info({
      listenerIndex: this.listenerIndex,
    }, 'PGListener connection established')
  }

  /**
   * Atomically subscribe to DBOS stream
   *
   * GUARANTEES:
   * - No events lost (catch-up query + LISTEN)
   * - No duplicates (isPendingCatchup flag + offset tracking)
   * - Multiple consumers share same MultiChannel
   *
   * @param streamId Stream identifier
   * @param fromOffset Starting offset (0-based)
   * @returns MultiChannel for consuming stream values
   */
  async subscribe<T = any>(
    streamId: StreamIdentifier,
    fromOffset: number,
  ): Promise<MultiChannel<T[]>> {
    const streamKey = this.getStreamKey(streamId)
    const pgChannel = this.getPGChannelName(streamId)

    // Check if already subscribed
    const existing = this.channels.get(streamKey)
    if (existing) {
      existing.consumerCount++
      logger.debug({
        streamKey,
        consumers: existing.consumerCount,
      }, 'Reusing existing stream channel')
      return existing.multiChannel as MultiChannel<T[]>
    }

    logger.info({
      streamKey,
      pgChannel,
      fromOffset,
    }, 'Creating new stream subscription')

    // === ATOMIC SUBSCRIPTION PROTOCOL ===

    // Step 1: Create MultiChannel
    const multiChannel = new MultiChannel<T[]>()

    // Step 2: Create channel state BEFORE LISTEN
    const channelState: StreamChannel<T> = {
      multiChannel,
      lastSentOffset: fromOffset - 1,
      consumerCount: 1,
      isPendingCatchup: true, // ← Critical: blocks notifications during catch-up
    }

    this.channels.set(streamKey, channelState)

    // Step 3: LISTEN to PostgreSQL channel (atomic)
    await this.subscriber.listenTo(pgChannel)

    logger.debug({
      streamKey,
      pgChannel,
    }, 'LISTEN command executed')

    // Step 4: Catch-up query for existing values
    // Notifications received during query are buffered but not processed (isPendingCatchup = true)
    try {
      const existingValues = await this.queryStreamFromOffset<T>(
        streamId,
        fromOffset,
      )

      if (existingValues.length > 0) {
        // Send initial batch to MultiChannel
        multiChannel.send(existingValues)

        // Update offset
        channelState.lastSentOffset = fromOffset + existingValues.length - 1

        logger.info({
          streamKey,
          values: existingValues.length,
          lastOffset: channelState.lastSentOffset,
        }, 'Initial catch-up complete')
      } else {
        logger.debug({
          streamKey,
        }, 'No existing values, ready for notifications')
      }
    } catch (error) {
      // Cleanup on error
      this.channels.delete(streamKey)
      await this.subscriber.unlisten(pgChannel)
      throw error
    }

    // Step 5: Enable notification processing (atomic flag flip)
    channelState.isPendingCatchup = false

    logger.info({
      streamKey,
      pgChannel,
    }, 'Stream subscription active')

    return multiChannel
  }

  /**
   * Unsubscribe from stream
   *
   * Decrements consumer count and cleans up if last consumer
   */
  async unsubscribe(streamId: StreamIdentifier): Promise<void> {
    const streamKey = this.getStreamKey(streamId)
    const channel = this.channels.get(streamKey)

    if (!channel) {
      logger.warn({
        streamKey,
      }, 'Unsubscribe called for non-existent channel')
      return
    }

    channel.consumerCount--

    logger.debug({
      streamKey,
      remainingConsumers: channel.consumerCount,
    }, 'Consumer unsubscribed')

    // Cleanup if last consumer
    if (channel.consumerCount <= 0) {
      const pgChannel = this.getPGChannelName(streamId)

      // Close MultiChannel
      channel.multiChannel.close()

      // UNLISTEN from PostgreSQL
      await this.subscriber.unlisten(pgChannel)

      // Remove from map
      this.channels.delete(streamKey)

      logger.info({
        streamKey,
        pgChannel,
      }, 'Stream channel cleaned up (last consumer left)')
    }
  }

  /**
   * Get stream count for load balancing
   */
  getStreamCount(): number {
    return this.channels.size
  }

  /**
   * Get listener statistics
   */
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

  /**
   * Close listener and cleanup all channels
   */
  async close(): Promise<void> {
    logger.info({
      listenerIndex: this.listenerIndex,
      activeStreams: this.channels.size,
    }, 'Closing PGListener')

    // Close all MultiChannels
    for (const channel of this.channels.values()) {
      channel.multiChannel.close()
    }

    // Clear channels
    this.channels.clear()

    // Close pg-listen subscriber
    await this.subscriber.close()

    logger.info({
      listenerIndex: this.listenerIndex,
    }, 'PGListener closed')
  }

  /**
   * Setup global notification handler for all channels
   *
   * This handler is called for ALL notifications on this subscriber.
   * It routes notifications to the correct StreamChannel.
   */
  private setupNotificationHandler(): void {
    this.subscriber.events.on('notification', (notification) => {
      const { channel, payload } = notification

      // Extract streamId from channel name
      // Format: dbos_stream_{workflowId}_{streamKey}
      const streamId = this.parseChannelName(channel)
      if (!streamId) {
        logger.warn({
          channel,
        }, 'Failed to parse channel name')
        return
      }

      const streamKey = this.getStreamKey(streamId)
      const channelState = this.channels.get(streamKey)

      if (!channelState) {
        logger.warn({
          streamKey,
          channel,
        }, 'Notification for unknown stream (already unsubscribed?)')
        return
      }

      // Skip if still in catch-up phase (prevents duplicates)
      if (channelState.isPendingCatchup) {
        logger.debug({
          streamKey,
          offset: payload.offset,
        }, 'Skipping notification during catch-up')
        return
      }

      // Only fetch if new offset
      if (payload.offset > channelState.lastSentOffset) {
        // Trigger async fetch (don't await - handler must be sync!)
        this.handleNotification(streamId, payload.offset).catch((error) => {
          logger.error({
            error: error instanceof Error ? error.message : String(error),
            streamKey,
          }, 'Error handling notification')
        })
      }
    })
  }

  /**
   * Handle notification: Query new values and send to MultiChannel
   */
  private async handleNotification(
    streamId: StreamIdentifier,
    notifiedOffset: number,
  ): Promise<void> {
    const streamKey = this.getStreamKey(streamId)
    const channelState = this.channels.get(streamKey)

    if (!channelState) {
      return
    }

    const startOffset = channelState.lastSentOffset + 1

    try {
      const newValues = await this.queryStreamFromOffset(
        streamId,
        startOffset,
      )

      if (newValues.length > 0) {
        // Filter out already-sent values (defensive)
        const unseenValues = newValues.slice(
          Math.max(0, channelState.lastSentOffset + 1 - startOffset),
        )

        if (unseenValues.length > 0) {
          // Send to MultiChannel
          channelState.multiChannel.send(unseenValues)

          // Update offset
          channelState.lastSentOffset = startOffset + newValues.length - 1
        }
      }
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        streamKey,
        startOffset,
      }, 'Error fetching stream values')
    }
  }

  /**
   * Query stream values from database with deduplication
   */
  private async queryStreamFromOffset<T>(
    streamId: StreamIdentifier,
    startOffset: number,
  ): Promise<T[]> {
    const streamKey = this.getStreamKey(streamId)
    const queryKey = `${streamKey}:${startOffset}`

    // Deduplicate concurrent queries
    const pending = this.pendingQueries.get(queryKey)
    if (pending) {
      logger.debug({
        streamKey,
        startOffset,
      }, 'Reusing pending query')
      return pending as Promise<T[]>
    }

    // Create new query
    const queryPromise = this.executeStreamQuery<T>(streamId, startOffset)

    this.pendingQueries.set(queryKey, queryPromise)

    try {
      const result = await queryPromise
      return result
    } finally {
      // Clear cache after brief delay
      setTimeout(() => {
        this.pendingQueries.delete(queryKey)
      }, 100)
    }
  }

  /**
   * Execute database query for stream values
   */
  private async executeStreamQuery<T>(
    streamId: StreamIdentifier,
    startOffset: number,
  ): Promise<T[]> {
    try {
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

      // Parse values
      const values: T[] = []

      for (const row of result.rows) {
        try {
          const parsed = JSON.parse(row.value)

          // For 'events' stream key, deserialize ExecutionEventImpl
          // DBOS.writeStream stores: { executionId, event: serializedEvent, timestamp }
          if (streamId.streamKey === 'events' && parsed.event) {
            // Deserialize the event (converts JSON to ExecutionEventImpl instance)
            const event = ExecutionEventImpl.deserializeStatic(parsed.event)
            if (event) {
              values.push(event as T)
            }
          } else {
            // For other stream keys, use value as-is
            values.push(parsed)
          }
        } catch (error) {
          logger.warn({
            workflowId: streamId.workflowId,
            streamKey: streamId.streamKey,
            offset: row.offset,
            error: error instanceof Error ? error.message : String(error),
          }, 'Failed to parse stream value')
        }
      }

      return values
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        workflowId: streamId.workflowId,
        streamKey: streamId.streamKey,
        startOffset,
      }, 'Database query failed')
      throw error
    }
  }

  /**
   * Parse PostgreSQL channel name to StreamIdentifier
   *
   * Format: dbos_stream_{workflowId}_{streamKey}
   */
  private parseChannelName(channel: string): StreamIdentifier | null {
    const prefix = 'dbos_stream_'
    if (!channel.startsWith(prefix)) {
      return null
    }

    const parts = channel.slice(prefix.length).split('_')
    if (parts.length < 2) {
      return null
    }

    // workflowId is first part, streamKey is rest joined by _
    const workflowId = parts[0]
    const streamKey = parts.slice(1).join('_')

    return { workflowId, streamKey }
  }

  /**
   * Get PostgreSQL channel name for stream
   */
  private getPGChannelName(streamId: StreamIdentifier): string {
    return `dbos_stream_${streamId.workflowId}_${streamId.streamKey}`
  }

  /**
   * Get internal stream key (for map storage)
   */
  private getStreamKey(streamId: StreamIdentifier): string {
    return `${streamId.workflowId}:${streamId.streamKey}`
  }
}
