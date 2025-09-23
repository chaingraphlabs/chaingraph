/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { MetricsTracker, ScopedMetricsTracker } from './MetricsTracker'
import type { MetricContext } from './types'
import { MetricStages } from './types'

/**
 * Helper class for common metric patterns
 */
export class MetricsHelper {
  constructor(private tracker: MetricsTracker | ScopedMetricsTracker) {}

  /**
   * Track database operation with timing
   */
  async trackDbOperation<T>(
    operationName: string,
    context: MetricContext,
    operation: () => Promise<T>,
    metadata?: {
      query?: string
      table?: string
      rows?: number
    },
  ): Promise<T> {
    return this.tracker.trackOperation({
      execute: operation,
      stage: MetricStages.DB_OPERATION,
      event: operationName,
      context,
      metadata: {
        operation: operationName,
        ...metadata,
      },
    })
  }

  /**
   * Track Kafka publish with metadata
   */
  async trackKafkaPublish<T>(
    topic: string,
    context: MetricContext,
    publish: () => Promise<T>,
    metadata?: {
      partition?: number
      size?: number
      key?: string
    },
  ): Promise<T> {
    return this.tracker.trackOperation({
      execute: publish,
      stage: MetricStages.TASK_QUEUE,
      event: 'publish',
      context,
      metadata: {
        topic,
        ...metadata,
      },
    })
  }

  /**
   * Track Kafka consume with metadata
   */
  async trackKafkaConsume<T>(
    topic: string,
    context: MetricContext,
    consume: () => Promise<T>,
    metadata?: {
      partition?: number
      offset?: number
      lag?: number
    },
  ): Promise<T> {
    return this.tracker.trackOperation({
      execute: consume,
      stage: MetricStages.TASK_QUEUE,
      event: 'consume',
      context,
      metadata: {
        topic,
        ...metadata,
      },
    })
  }

  /**
   * Track flow loading with cache info
   */
  async trackFlowLoad<T>(
    flowId: string,
    context: MetricContext,
    load: () => Promise<T>,
    metadata?: {
      cache?: boolean
      source?: 'cache' | 'database'
    },
  ): Promise<{ result: T, cacheHit: boolean }> {
    const startTime = Date.now()
    const operationId = this.tracker.generateOperationId(MetricStages.FLOW_LOAD, 'load')

    this.tracker.startTimer(operationId)

    try {
      const result = await load()
      const duration = this.tracker.endTimer(operationId)
      const cacheHit = metadata?.cache ?? false

      this.tracker.track({
        stage: MetricStages.FLOW_LOAD,
        event: cacheHit ? 'cache_hit' : 'cache_miss',
        context,
        timestamp: Date.now(),
        load_duration_ms: duration,
        flowId,
        cache_hit: cacheHit,
        ...metadata,
      })

      return { result, cacheHit }
    } catch (error) {
      const duration = this.tracker.endTimer(operationId)

      this.tracker.track({
        stage: MetricStages.FLOW_LOAD,
        event: 'error',
        context,
        timestamp: Date.now(),
        load_duration_ms: duration,
        flowId,
        error: error instanceof Error ? error.message : String(error),
        ...metadata,
      })

      throw error
    }
  }

  /**
   * Track execution claim attempt
   */
  async trackClaimAttempt<T>(
    executionId: string,
    workerId: string,
    claim: () => Promise<T>,
    metadata?: {
      timeout?: number
      retry?: number
    },
  ): Promise<T> {
    const context: MetricContext = { executionId, workerId }

    return this.tracker.trackOperation({
      execute: claim,
      stage: MetricStages.CLAIM,
      event: 'attempt',
      context,
      metadata,
    })
  }

  /**
   * Track child execution spawning
   */
  async trackChildSpawn<T>(
    parentExecutionId: string,
    childExecutionId: string,
    context: MetricContext,
    spawn: () => Promise<T>,
    metadata?: {
      eventType?: string
      depth?: number
    },
  ): Promise<T> {
    return this.tracker.trackOperation({
      execute: spawn,
      stage: MetricStages.CHILD_SPAWN,
      event: 'spawn',
      context: {
        ...context,
        parentExecutionId,
      },
      metadata: {
        childExecutionId,
        ...metadata,
      },
    })
  }

  /**
   * Track complete task lifecycle with breakdown
   */
  trackLifecycleComplete(
    context: MetricContext,
    breakdown: {
      queue_wait?: number
      claim?: number
      flow_load?: number
      init?: number
      execution?: number
      event_publish?: number
      child_spawn?: number
      status_update?: number
      cleanup?: number
    },
  ): void {
    const total = Object.values(breakdown).reduce((sum, val) => sum + (val || 0), 0)
    const executionTime = breakdown.execution || 0
    const overhead = total - executionTime
    const overheadPercentage = total > 0 ? (overhead / total) * 100 : 0

    this.tracker.track({
      stage: MetricStages.LIFECYCLE,
      event: 'task_complete',
      context,
      timestamp: Date.now(),
      total_duration_ms: total,
      breakdown,
      overhead_percentage: Number.parseFloat(overheadPercentage.toFixed(1)),
    })
  }

  /**
   * Track lifecycle failure with error details
   */
  trackLifecycleFailure(
    context: MetricContext,
    error: Error | string,
    breakdown: Partial<{
      queue_wait: number
      claim: number
      flow_load: number
      init: number
      execution: number
      event_publish: number
      child_spawn: number
      status_update: number
      cleanup: number
    }>,
  ): void {
    const total = Object.values(breakdown).reduce((sum, val) => sum + (val || 0), 0)

    this.tracker.track({
      stage: MetricStages.LIFECYCLE,
      event: 'task_failed',
      context,
      timestamp: Date.now(),
      total_duration_ms: total,
      breakdown,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  /**
   * Track event batch publishing
   */
  async trackEventBatch<T>(
    executionId: string,
    eventCount: number,
    publish: () => Promise<T>,
    metadata?: {
      batchSize?: number
      topic?: string
    },
  ): Promise<T> {
    const context: MetricContext = { executionId }

    return this.tracker.trackOperation({
      execute: publish,
      stage: MetricStages.EVENT_PUBLISH,
      event: 'batch',
      context,
      metadata: {
        event_count: eventCount,
        ...metadata,
      },
    })
  }

  /**
   * Track resource snapshot
   */
  trackResourceSnapshot(
    context: MetricContext,
    resources: {
      cpuUsage?: number
      memoryHeapUsed?: number
      memoryHeapTotal?: number
      eventLoopLag?: number
      pgConnections?: {
        active: number
        idle: number
      }
      kafkaMetrics?: {
        producerQueueSize: number
        consumerLag: number
      }
    },
  ): void {
    this.tracker.track({
      stage: MetricStages.RESOURCES,
      event: 'snapshot',
      context,
      timestamp: Date.now(),
      cpu_usage_pct: resources.cpuUsage,
      memory_heap_used_mb: resources.memoryHeapUsed,
      memory_heap_total_mb: resources.memoryHeapTotal,
      event_loop_lag_ms: resources.eventLoopLag,
      pg_connections_active: resources.pgConnections?.active,
      pg_connections_idle: resources.pgConnections?.idle,
      kafka_producer_queue_size: resources.kafkaMetrics?.producerQueueSize,
      kafka_consumer_lag: resources.kafkaMetrics?.consumerLag,
    })
  }

  /**
   * Create a timer helper for manual timing
   */
  createTimer(stage: string, event: string): TimerHelper {
    return new TimerHelper(this.tracker, stage, event)
  }
}

/**
 * Helper class for manual timing operations
 */
export class TimerHelper {
  private operationId: string
  private startTime: number

  constructor(
    private tracker: MetricsTracker | ScopedMetricsTracker,
    private stage: string,
    private event: string,
  ) {
    this.operationId = tracker.generateOperationId(stage, event)
    this.startTime = Date.now()
    tracker.startTimer(this.operationId)
  }

  /**
   * End timer and return duration
   */
  end(): number | undefined {
    return this.tracker.endTimer(this.operationId)
  }

  /**
   * End timer and track metric
   */
  endAndTrack(context: MetricContext, metadata?: Record<string, any>): void {
    const duration = this.end()

    this.tracker.track({
      stage: this.stage as any,
      event: this.event as any,
      context,
      timestamp: Date.now(),
      duration_ms: duration,
      ...metadata,
    })
  }

  /**
   * Get elapsed time without ending timer
   */
  elapsed(): number {
    return Date.now() - this.startTime
  }
}

/**
 * Lifecycle metrics builder for complex tracking
 */
export class LifecycleMetricsBuilder {
  private breakdown: Record<string, number> = {}
  private timers: Map<string, number> = new Map()

  /**
   * Start timing a phase
   */
  startPhase(phase: string): void {
    this.timers.set(phase, Date.now())
  }

  /**
   * End timing a phase
   */
  endPhase(phase: string): number {
    const startTime = this.timers.get(phase)
    if (!startTime) {
      return 0
    }

    const duration = Date.now() - startTime
    this.breakdown[phase] = duration
    this.timers.delete(phase)
    return duration
  }

  /**
   * Add a pre-calculated duration
   */
  addPhase(phase: string, duration: number): void {
    this.breakdown[phase] = duration
  }

  /**
   * Get current breakdown
   */
  getBreakdown(): Record<string, number> {
    return { ...this.breakdown }
  }

  /**
   * Get total duration
   */
  getTotalDuration(): number {
    return Object.values(this.breakdown).reduce((sum, val) => sum + val, 0)
  }

  /**
   * Calculate overhead percentage (non-execution time)
   */
  getOverheadPercentage(executionPhase = 'execution'): number {
    const total = this.getTotalDuration()
    const executionTime = this.breakdown[executionPhase] || 0
    const overhead = total - executionTime

    return total > 0 ? (overhead / total) * 100 : 0
  }

  /**
   * Track completion with a metrics tracker
   */
  trackCompletion(
    tracker: MetricsTracker | ScopedMetricsTracker,
    context: MetricContext,
  ): void {
    const helper = new MetricsHelper(tracker)
    helper.trackLifecycleComplete(context, this.breakdown)
  }

  /**
   * Track failure with a metrics tracker
   */
  trackFailure(
    tracker: MetricsTracker | ScopedMetricsTracker,
    context: MetricContext,
    error: Error | string,
  ): void {
    const helper = new MetricsHelper(tracker)
    helper.trackLifecycleFailure(context, error, this.breakdown)
  }

  /**
   * Reset the builder
   */
  reset(): void {
    this.breakdown = {}
    this.timers.clear()
  }
}
