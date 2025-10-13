/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { MultiChannel } from '@badaitech/chaingraph-types'
import type { Pool } from 'pg'
import type {
  PoolStats,
  StreamIdentifier,
} from './types'

import { DBOS } from '@dbos-inc/dbos-sdk'
import { createLogger } from '../../../utils/logger'
import { PGListenerPool } from './PGListenerPool'

const logger = createLogger('dbos-stream-subscriber')

/**
 * Generic DBOS stream subscriber
 *
 * Provides generic API for:
 * - Reading from DBOS streams → MultiChannel
 * - Writing from MultiChannel → DBOS streams
 * - Bidirectional pipes
 *
 * Manages PGListenerPool for scalable notification handling
 */
export class DBOSStreamSubscriber {
  /** Pool of PGListener instances */
  private readonly pool: PGListenerPool

  /** Active publish bridges (MultiChannel → DBOS) */
  private readonly activeBridges = new Set<() => Promise<void>>()

  /** Whether pool is initialized */
  private isInitialized = false

  constructor(connectionString: string, queryPool: Pool) {
    this.pool = new PGListenerPool(connectionString, queryPool)
  }

  /**
   * Initialize pool (connect all listeners)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Stream subscriber already initialized')
      return
    }

    await this.pool.initialize()
    this.isInitialized = true

    logger.info('DBOS stream subscriber initialized')
  }

  /**
   * Subscribe to DBOS stream → Get MultiChannel
   *
   * @param workflowId DBOS workflow UUID
   * @param streamKey Stream key within workflow
   * @param fromOffset Starting offset (0-based)
   * @returns MultiChannel yielding batches of stream values
   */
  subscribe<T = any>(
    workflowId: string,
    streamKey: string,
    fromOffset: number = 0,
  ): Promise<MultiChannel<T[]>> {
    const streamId: StreamIdentifier = { workflowId, streamKey }

    logger.debug({
      workflowId,
      streamKey,
      fromOffset,
    }, 'Subscribing to DBOS stream')

    return this.pool.subscribe<T>(streamId, fromOffset)
  }

  /**
   * Publish from MultiChannel → DBOS stream
   *
   * Creates background task that reads from MultiChannel and writes to DBOS.
   * Returns cleanup function.
   *
   * @param workflowId DBOS workflow UUID
   * @param streamKey Stream key to write to
   * @param source MultiChannel to read from
   * @returns Cleanup function to stop publishing
   */
  async publishFromChannel<T>(
    workflowId: string,
    streamKey: string,
    source: MultiChannel<T>,
  ): Promise<() => Promise<void>> {
    logger.info({
      workflowId,
      streamKey,
    }, 'Creating publish bridge: MultiChannel → DBOS stream')

    let isActive = true
    let itemsPublished = 0

    // Background task: Read from MultiChannel → Write to DBOS stream
    const publishTask = (async () => {
      try {
        for await (const value of source) {
          if (!isActive) {
            logger.debug({
              workflowId,
              streamKey,
              itemsPublished,
            }, 'Publish bridge stopped')
            break
          }

          // Write to DBOS stream
          await DBOS.writeStream(streamKey, {
            workflowId,
            value,
            timestamp: Date.now(),
          })

          itemsPublished++

          logger.debug({
            workflowId,
            streamKey,
            itemsPublished,
          }, 'Value published to DBOS stream')
        }

        logger.info({
          workflowId,
          streamKey,
          totalPublished: itemsPublished,
        }, 'Publish bridge completed (source closed)')
      } catch (error) {
        logger.error({
          error: error instanceof Error ? error.message : String(error),
          workflowId,
          streamKey,
          itemsPublished,
        }, 'Error in publish bridge')
      }
    })()

    // Cleanup function
    const cleanup = async () => {
      isActive = false
      await publishTask
      this.activeBridges.delete(cleanup)

      logger.debug({
        workflowId,
        streamKey,
      }, 'Publish bridge cleaned up')
    }

    this.activeBridges.add(cleanup)

    return cleanup
  }

  /**
   * Unsubscribe from stream
   */
  async unsubscribe(streamId: StreamIdentifier): Promise<void> {
    await this.pool.unsubscribe(streamId)
  }

  /**
   * Get pool statistics
   */
  getStats(): PoolStats {
    return this.pool.getPoolStats()
  }

  /**
   * Close subscriber and cleanup all resources
   */
  async close(): Promise<void> {
    logger.info('Closing DBOS stream subscriber')

    // Stop all active publish bridges
    const bridgeCleanups = Array.from(this.activeBridges).map(cleanup => cleanup())
    await Promise.allSettled(bridgeCleanups)

    this.activeBridges.clear()

    // Close pool
    await this.pool.close()

    logger.info('DBOS stream subscriber closed')
  }
}
