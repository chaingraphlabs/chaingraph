/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionEventImpl, MultiChannel } from '@badaitech/chaingraph-types'
import type { Pool } from 'pg'
import type {
  PipeOptions,
  PoolStats,
  PublishOptions,
  StreamIdentifier,
  StreamPipe,
  SubscribeOptions,
} from './types'

import { MultiChannel as MC } from '@badaitech/chaingraph-types'
import { createLogger } from '../../../utils/logger'
import { DBOSStreamSubscriber } from './DBOSStreamSubscriber'

const logger = createLogger('stream-bridge')

/**
 * User-friendly interface for DBOS stream ↔ MultiChannel bridging
 *
 * This is the main public API that chaingraph nodes and consumers use.
 * Provides clean interface for:
 * - Reading DBOS streams → MultiChannel
 * - Writing MultiChannel → DBOS streams
 * - Bidirectional pipes
 *
 * Abstracts away PGListener pool complexity.
 */
export class StreamBridge {
  /** Generic stream subscriber (handles pool routing) */
  private readonly streamSubscriber: DBOSStreamSubscriber

  /** Active publish bridges for cleanup */
  private readonly activeBridges = new Set<() => Promise<void>>()

  constructor(connectionString: string, queryPool: Pool) {
    this.streamSubscriber = new DBOSStreamSubscriber(connectionString, queryPool)
  }

  /**
   * Initialize StreamBridge (connect PGListener pool)
   */
  async initialize(): Promise<void> {
    await this.streamSubscriber.initialize()
    logger.info('StreamBridge initialized')
  }

  /**
   * Subscribe to DBOS stream → Get MultiChannel
   *
   * @example
   * const channel = await streamBridge.subscribe({
   *   workflowId: 'exec-123',
   *   streamKey: 'events',
   *   fromOffset: 0
   * })
   *
   * for await (const batch of channel) {
   *   console.log(batch)
   * }
   *
   * @param options Subscribe options
   * @returns MultiChannel yielding batches of stream values
   */
  async subscribe<T = any>(
    options: SubscribeOptions,
  ): Promise<MultiChannel<T[]>> {
    logger.debug({
      workflowId: options.workflowId,
      streamKey: options.streamKey,
      fromOffset: options.fromOffset ?? 0,
    }, 'StreamBridge.subscribe() called')

    return this.streamSubscriber.subscribe<T>(
      options.workflowId,
      options.streamKey,
      options.fromOffset ?? 0,
    )
  }

  /**
   * Publish MultiChannel → DBOS stream
   *
   * Creates background task that reads from MultiChannel
   * and writes to DBOS stream automatically.
   *
   * @example
   * const myChannel = new MultiChannel<Result>()
   *
   * await streamBridge.publish({
   *   workflowId: 'exec-123',
   *   streamKey: 'results',
   *   source: myChannel
   * })
   *
   * myChannel.send({ status: 'done' })
   *
   * @param options Publish options
   */
  async publish<T>(options: PublishOptions<T>): Promise<void> {
    logger.info({
      workflowId: options.workflowId,
      streamKey: options.streamKey,
    }, 'StreamBridge.publish() called')

    const cleanup = await this.streamSubscriber.publishFromChannel(
      options.workflowId,
      options.streamKey,
      options.source,
    )

    this.activeBridges.add(cleanup)
  }

  /**
   * Create bidirectional pipe (input + output channels)
   *
   * @example
   * const pipe = await streamBridge.createPipe({
   *   workflowId: 'exec-123',
   *   input: 'commands',
   *   output: 'results'
   * })
   *
   * pipe.input.send({ cmd: 'start' })
   *
   * for await (const result of pipe.output) {
   *   console.log(result)
   * }
   *
   * await pipe.close()
   *
   * @param options Pipe options
   * @returns Bidirectional stream pipe
   */
  async createPipe<TInput = any, TOutput = any>(
    options: PipeOptions,
  ): Promise<StreamPipe<TInput, TOutput>> {
    logger.info({
      workflowId: options.workflowId,
      input: options.input,
      output: options.output,
    }, 'Creating bidirectional pipe')

    // Create input channel (MultiChannel → DBOS)
    const inputChannel = new MC<TInput>()

    // Subscribe to output channel (DBOS → MultiChannel)
    const outputChannel = await this.subscribe<TOutput>({
      workflowId: options.workflowId,
      streamKey: options.output,
    })

    // Bridge input channel to DBOS
    await this.publish({
      workflowId: options.workflowId,
      streamKey: options.input,
      source: inputChannel,
    })

    return {
      input: inputChannel,
      output: outputChannel,
      close: async () => {
        logger.debug({
          workflowId: options.workflowId,
        }, 'Closing pipe')

        inputChannel.close()
        outputChannel.close()

        // Cleanup will happen via activeBridges
      },
    }
  }

  /**
   * Convenience helper for execution events (backward compatibility)
   *
   * @param executionId Execution ID (also workflow ID)
   * @param fromIndex Starting event index
   * @returns MultiChannel yielding event batches
   */
  async subscribeToExecutionEvents(
    executionId: string,
    fromIndex: number = 0,
  ): Promise<MultiChannel<ExecutionEventImpl[]>> {
    logger.debug({
      executionId,
      fromIndex,
    }, 'Subscribing to execution events (backward compat)')

    return this.subscribe<ExecutionEventImpl>({
      workflowId: executionId,
      streamKey: 'events',
      fromOffset: fromIndex,
    })
  }

  /**
   * Unsubscribe from stream
   */
  async unsubscribe(workflowId: string, streamKey: string): Promise<void> {
    const streamId: StreamIdentifier = { workflowId, streamKey }
    await this.streamSubscriber.unsubscribe(streamId)
  }

  /**
   * Get pool statistics for monitoring
   */
  getStats(): PoolStats {
    return this.streamSubscriber.getStats()
  }

  /**
   * Close StreamBridge and cleanup all resources
   */
  async close(): Promise<void> {
    logger.info('Closing StreamBridge')

    // Stop all publish bridges
    const cleanups = Array.from(this.activeBridges).map(cleanup => cleanup())
    await Promise.allSettled(cleanups)

    this.activeBridges.clear()

    // Close stream subscriber (and pool)
    await this.streamSubscriber.close()

    logger.info('StreamBridge closed')
  }
}

/**
 * Builder for creating StreamBridge instances
 */
export class StreamBridgeBuilder {
  /**
   * Create and initialize StreamBridge
   *
   * @param config Configuration
   * @returns Ready-to-use StreamBridge instance
   */
  static async create(config: {
    connectionString: string
    queryPool: Pool
  }): Promise<StreamBridge> {
    const bridge = new StreamBridge(config.connectionString, config.queryPool)

    await bridge.initialize()

    logger.info('StreamBridge created via builder')

    return bridge
  }
}
