/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Pool } from 'pg'
import type { MultiChannel } from '@badaitech/chaingraph-types'
import type {
  PoolStats,
  StreamIdentifier,
} from './types'

import { createLogger } from '../../../utils/logger'
import { PGListener } from './PGListener'
import { POOL_CONFIG } from './types'

const logger = createLogger('pg-listener-pool')

/**
 * Pool of PGListener instances for horizontal scaling
 *
 * Features:
 * - Hash-based consistent routing
 * - Fallback to least-loaded on capacity
 * - Aggregate statistics
 * - Graceful shutdown
 */
export class PGListenerPool {
  /** Pool of PGListener instances */
  private readonly listeners: PGListener[] = []

  /** PostgreSQL connection string */
  private readonly connectionString: string

  /** Query pool shared across all listeners */
  private readonly queryPool: Pool

  /** Stream → Listener mapping for fast lookups */
  private readonly streamToListener = new Map<string, PGListener>()

  constructor(connectionString: string, queryPool: Pool) {
    this.connectionString = connectionString
    this.queryPool = queryPool
  }

  /**
   * Initialize pool and connect all listeners
   */
  async initialize(): Promise<void> {
    logger.info({
      poolSize: POOL_CONFIG.SIZE,
      maxStreamsPerListener: POOL_CONFIG.MAX_STREAMS_PER_LISTENER,
    }, 'Initializing PGListener pool')

    // Create listeners
    for (let i = 0; i < POOL_CONFIG.SIZE; i++) {
      const listener = new PGListener(
        this.connectionString,
        this.queryPool,
        i,
      )

      this.listeners.push(listener)
    }

    // Connect all listeners in parallel
    await Promise.all(
      this.listeners.map(listener => listener.connect()),
    )

    logger.info({
      poolSize: POOL_CONFIG.SIZE,
    }, 'PGListener pool initialized')
  }

  /**
   * Get PGListener for stream using consistent hash routing
   *
   * Strategy:
   * 1. Hash streamId → listener index (consistent routing)
   * 2. If listener at capacity → fallback to least-loaded
   *
   * Benefits:
   * - Same stream always routes to same listener (cache locality)
   * - Automatic load balancing when capacity reached
   */
  getListenerForStream(streamId: StreamIdentifier): PGListener {
    const streamKey = this.getStreamKey(streamId)

    // Check if stream already has assigned listener
    const existing = this.streamToListener.get(streamKey)
    if (existing) {
      return existing
    }

    // Hash-based routing
    const hash = this.hashString(streamKey)
    const index = hash % this.listeners.length
    const listener = this.listeners[index]

    // Check capacity
    if (listener.getStreamCount() >= POOL_CONFIG.MAX_STREAMS_PER_LISTENER) {
      logger.warn({
        listenerIndex: index,
        streamCount: listener.getStreamCount(),
      }, 'Listener at capacity, using least-loaded')

      // Fallback to least-loaded
      const leastLoaded = this.getLeastLoaded()
      this.streamToListener.set(streamKey, leastLoaded)
      return leastLoaded
    }

    // Store mapping
    this.streamToListener.set(streamKey, listener)

    logger.debug({
      streamKey,
      listenerIndex: index,
      hash,
    }, 'Stream routed to listener')

    return listener
  }

  /**
   * Subscribe to stream (delegates to appropriate listener)
   */
  async subscribe<T>(
    streamId: StreamIdentifier,
    fromOffset: number,
  ): Promise<MultiChannel<T[]>> {
    const listener = this.getListenerForStream(streamId)
    return listener.subscribe<T>(streamId, fromOffset)
  }

  /**
   * Unsubscribe from stream
   */
  async unsubscribe(streamId: StreamIdentifier): Promise<void> {
    const streamKey = this.getStreamKey(streamId)
    const listener = this.streamToListener.get(streamKey)

    if (!listener) {
      logger.warn({
        streamKey,
      }, 'Unsubscribe called for unknown stream')
      return
    }

    await listener.unsubscribe(streamId)

    // Remove from mapping when fully unsubscribed
    // Note: PGListener handles last consumer cleanup
    this.streamToListener.delete(streamKey)
  }

  /**
   * Get pool-wide statistics
   */
  getPoolStats(): PoolStats {
    const listenerStats = this.listeners.map(l => l.getStats())

    const totalStreams = listenerStats.reduce((sum, s) => sum + s.streamCount, 0)
    const totalConsumers = listenerStats.reduce((sum, s) => sum + s.totalConsumers, 0)
    const loadDistribution = listenerStats.map(s => s.streamCount)

    return {
      poolSize: this.listeners.length,
      totalStreams,
      totalConsumers,
      listeners: listenerStats,
      loadDistribution,
    }
  }

  /**
   * Close pool and all listeners
   */
  async close(): Promise<void> {
    logger.info({
      poolSize: this.listeners.length,
    }, 'Closing PGListener pool')

    // Close all listeners in parallel
    await Promise.all(
      this.listeners.map(listener => listener.close()),
    )

    this.streamToListener.clear()

    logger.info('PGListener pool closed')
  }

  /**
   * Get least-loaded listener (fallback strategy)
   */
  private getLeastLoaded(): PGListener {
    return this.listeners.reduce((min, curr) =>
      curr.getStreamCount() < min.getStreamCount() ? curr : min,
    )
  }

  /**
   * Hash string to number using FNV-1a algorithm
   *
   * Fast, good distribution, consistent
   */
  private hashString(str: string): number {
    let hash = 2166136261 // FNV offset basis

    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i)
      hash = Math.imul(hash, 16777619) // FNV prime
    }

    return hash >>> 0 // Convert to unsigned 32-bit
  }

  /**
   * Get internal stream key for mapping
   */
  private getStreamKey(streamId: StreamIdentifier): string {
    return `${streamId.workflowId}:${streamId.streamKey}`
  }
}
