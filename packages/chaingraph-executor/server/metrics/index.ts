/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { MetricsConfig } from './MetricsTracker'
import process from 'node:process'
import { config } from '../utils/config'
import { MetricsTracker } from './MetricsTracker'

// Global metrics configuration
const globalMetricsConfig: MetricsConfig = {
  enabled: config.metrics?.enabled ?? (process.env.ENABLE_METRICS === 'true'),
  logLevel: config.metrics?.logLevel ?? ((process.env.METRICS_LOG_LEVEL as 'debug' | 'info' | 'warn') || 'debug'),
  sampling: config.metrics?.sampling ?? (
    process.env.METRICS_SAMPLING_ENABLED === 'true'
      ? {
          enabled: true,
          rate: Number.parseFloat(process.env.METRICS_SAMPLING_RATE || '1.0'),
        }
      : undefined
  ),
  batchSize: config.metrics?.batchSize ?? Number.parseInt(process.env.METRICS_BATCH_SIZE || '1', 10),
  flushInterval: config.metrics?.flushInterval ?? Number.parseInt(process.env.METRICS_FLUSH_INTERVAL || '1000', 10),
  includeMemoryMetrics: config.metrics?.includeMemoryMetrics ?? (process.env.METRICS_INCLUDE_MEMORY === 'true'),
}

/**
 * Factory function to create metrics tracker
 */
export function createMetricsTracker(
  moduleName: string,
  overrides?: Partial<MetricsConfig>,
): MetricsTracker {
  return new MetricsTracker(moduleName, {
    ...globalMetricsConfig,
    ...overrides,
  })
}

/**
 * Check if metrics are globally enabled
 */
export function isMetricsEnabled(): boolean {
  return globalMetricsConfig.enabled
}

/**
 * Update global metrics configuration
 * Useful for runtime configuration changes
 */
export function updateGlobalMetricsConfig(updates: Partial<MetricsConfig>): void {
  Object.assign(globalMetricsConfig, updates)
}

export { LifecycleMetricsBuilder, MetricsHelper, TimerHelper } from './helpers'
// Re-export types and classes
export { MetricsTracker, ScopedMetricsTracker } from './MetricsTracker'

export type { MetricsConfig } from './MetricsTracker'

export * from './types'

// Export common stage constants for convenience
export { MetricStages } from './types'
