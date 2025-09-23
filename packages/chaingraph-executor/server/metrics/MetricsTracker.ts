/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Logger } from 'pino'
import type { BaseMetricEvent, MetricContext, MetricEvent, MetricOperation, ResourceMetric } from './types'
import process from 'node:process'
import { createLogger } from '../utils/logger'
import { MetricStages } from './types'

export interface MetricsConfig {
  enabled: boolean
  logLevel?: 'debug' | 'info' | 'warn'
  sampling?: {
    enabled: boolean
    rate: number // 0.0 to 1.0
  }
  includeMemoryMetrics?: boolean
  batchSize?: number // Batch metrics before logging
  flushInterval?: number // ms
}

/**
 * Main metrics tracking class
 */
export class MetricsTracker {
  private readonly logger: Logger
  private readonly config: MetricsConfig
  private readonly buffer: MetricEvent[] = []
  private flushTimer?: NodeJS.Timeout
  private readonly startTimes: Map<string, number> = new Map()
  private readonly moduleName: string

  constructor(
    moduleName: string,
    config: Partial<MetricsConfig> = {},
  ) {
    this.moduleName = moduleName
    this.logger = createLogger(`metrics:${moduleName}`)
    this.config = {
      enabled: true,
      logLevel: 'debug',
      batchSize: 1, // Default to immediate logging
      flushInterval: 1000,
      ...config,
    }

    if ((this.config.batchSize || 0) > 1 && this.config.enabled) {
      this.startBatchTimer()
    }
  }

  /**
   * Check if metrics are enabled
   */
  get isEnabled(): boolean {
    return this.config.enabled
  }

  /**
   * Start timing an operation
   */
  startTimer(operationId: string): void {
    if (!this.config.enabled)
      return
    this.startTimes.set(operationId, Date.now())
  }

  /**
   * End timing and return duration
   */
  endTimer(operationId: string): number | undefined {
    if (!this.config.enabled)
      return

    const startTime = this.startTimes.get(operationId)
    if (!startTime)
      return

    this.startTimes.delete(operationId)
    return Date.now() - startTime
  }

  /**
   * Generate operation ID for timing
   */
  generateOperationId(stage: string, event: string): string {
    return `${stage}_${event}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Track a metric event
   */
  track<T extends MetricEvent>(event: T): void {
    if (!this.config.enabled)
      return

    // Apply sampling if configured
    if (this.config.sampling?.enabled) {
      if (Math.random() > this.config.sampling.rate)
        return
    }

    const enrichedEvent = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      module: this.moduleName,
    }

    if (this.config.batchSize && this.config.batchSize > 1) {
      this.buffer.push(enrichedEvent)
      if (this.buffer.length >= this.config.batchSize) {
        this.flush()
      }
    } else {
      this.logMetric(enrichedEvent)
    }
  }

  /**
   * Track an async operation with automatic timing
   */
  async trackOperation<T>(
    operation: MetricOperation<T>,
  ): Promise<T> {
    if (!this.config.enabled) {
      return await Promise.resolve(operation.execute())
    }

    const operationId = this.generateOperationId(operation.stage, operation.event)
    this.startTimer(operationId)

    const startMetric: BaseMetricEvent = {
      stage: operation.stage,
      event: `${operation.event}_start`,
      context: operation.context,
      timestamp: Date.now(),
      ...operation.metadata,
    }

    this.track(startMetric as MetricEvent)

    try {
      const result = await Promise.resolve(operation.execute())
      const duration = this.endTimer(operationId)

      const completeMetric: BaseMetricEvent = {
        stage: operation.stage,
        event: `${operation.event}_complete`,
        context: operation.context,
        timestamp: Date.now(),
        duration_ms: duration,
        ...operation.metadata,
      }

      this.track(completeMetric as MetricEvent)
      return result
    } catch (error) {
      const duration = this.endTimer(operationId)

      const errorMetric: BaseMetricEvent = {
        stage: operation.stage,
        event: `${operation.event}_error`,
        context: operation.context,
        timestamp: Date.now(),
        duration_ms: duration,
        error: error instanceof Error ? error.message : String(error),
        ...operation.metadata,
      }

      this.track(errorMetric as MetricEvent)
      throw error
    }
  }

  /**
   * Track a synchronous operation with automatic timing
   */
  trackSync<T>(
    stage: string,
    event: string,
    context: MetricContext,
    operation: () => T,
    metadata?: Record<string, any>,
  ): T {
    if (!this.config.enabled) {
      return operation()
    }

    const operationId = this.generateOperationId(stage, event)
    this.startTimer(operationId)

    try {
      const result = operation()
      const duration = this.endTimer(operationId)

      this.track({
        stage,
        event: `${event}_complete`,
        context,
        timestamp: Date.now(),
        duration_ms: duration,
        ...metadata,
      } as MetricEvent)

      return result
    } catch (error) {
      const duration = this.endTimer(operationId)

      this.track({
        stage,
        event: `${event}_error`,
        context,
        timestamp: Date.now(),
        duration_ms: duration,
        error: error instanceof Error ? error.message : String(error),
        ...metadata,
      } as MetricEvent)

      throw error
    }
  }

  /**
   * Create a scoped tracker with preset context
   */
  withContext(context: Partial<MetricContext>): ScopedMetricsTracker {
    return new ScopedMetricsTracker(this, context)
  }

  /**
   * Flush buffered metrics
   */
  flush(): void {
    if (!this.config.enabled || this.buffer.length === 0)
      return

    const metrics = [...this.buffer]
    this.buffer.length = 0

    // Log each metric
    metrics.forEach(metric => this.logMetric(metric))
  }

  private logMetric(metric: MetricEvent): void {
    const level = this.config.logLevel || 'debug'

    // Add special fields for better Grafana/Loki processing
    const logEntry = {
      ...metric,
      metric_type: 'execution_pipeline',
      metric_version: '1.0.0',
    }

    this.logger[level](logEntry, 'metric')
  }

  private startBatchTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.config.flushInterval || 1000)
  }

  /**
   * Track memory usage
   */
  trackMemoryUsage(context: MetricContext): void {
    if (!this.config.enabled || !this.config.includeMemoryMetrics)
      return

    const memUsage = process.memoryUsage()

    const memoryMetric: ResourceMetric = {
      stage: MetricStages.RESOURCES,
      event: 'memory_snapshot',
      context,
      timestamp: Date.now(),
      memory_heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
      memory_heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
      memory_external_mb: Math.round(memUsage.external / 1024 / 1024),
      memory_rss_mb: Math.round(memUsage.rss / 1024 / 1024),
    }

    this.track(memoryMetric)
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = undefined
    }
    this.flush()
    this.startTimes.clear()
  }
}

/**
 * Scoped tracker with preset context
 */
export class ScopedMetricsTracker {
  constructor(
    private tracker: MetricsTracker,
    private context: Partial<MetricContext>,
  ) {}

  /**
   * Check if metrics are enabled
   */
  get isEnabled(): boolean {
    return this.tracker.isEnabled
  }

  /**
   * Track event with scoped context
   */
  track<T extends MetricEvent>(event: Omit<T, 'context'> & { context?: Partial<MetricContext> }): void {
    this.tracker.track({
      ...event,
      context: {
        ...this.context,
        ...(event.context || {}),
      } as MetricContext,
    } as T)
  }

  /**
   * Track async operation with scoped context
   */
  async trackOperation<T>(
    operation: Omit<MetricOperation<T>, 'context'> & { context?: Partial<MetricContext> },
  ): Promise<T> {
    return this.tracker.trackOperation({
      ...operation,
      context: {
        ...this.context,
        ...(operation.context || {}),
      } as MetricContext,
    } as MetricOperation<T>)
  }

  /**
   * Track sync operation with scoped context
   */
  trackSync<T>(
    stage: string,
    event: string,
    operation: () => T,
    metadata?: Record<string, any>,
  ): T {
    return this.tracker.trackSync(
      stage,
      event,
      this.context as MetricContext,
      operation,
      metadata,
    )
  }

  /**
   * Start timer
   */
  startTimer(operationId: string): void {
    this.tracker.startTimer(operationId)
  }

  /**
   * End timer
   */
  endTimer(operationId: string): number | undefined {
    return this.tracker.endTimer(operationId)
  }

  /**
   * Generate operation ID
   */
  generateOperationId(stage: string, event: string): string {
    return this.tracker.generateOperationId(stage, event)
  }

  /**
   * Track memory usage with scoped context
   */
  trackMemoryUsage(): void {
    this.tracker.trackMemoryUsage(this.context as MetricContext)
  }

  /**
   * Create a new scoped tracker with additional context
   */
  withContext(additionalContext: Partial<MetricContext>): ScopedMetricsTracker {
    return new ScopedMetricsTracker(this.tracker, {
      ...this.context,
      ...additionalContext,
    })
  }
}
