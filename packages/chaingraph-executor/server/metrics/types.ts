/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * Core metric stages in the execution pipeline
 */
export const MetricStages = {
  TASK_QUEUE: 'task_queue',
  CLAIM: 'claim',
  FLOW_LOAD: 'flow_load',
  INIT: 'init',
  EVENT_PUBLISH: 'event_publish',
  CHILD_SPAWN: 'child_spawn',
  DB_OPERATION: 'db_operation',
  LIFECYCLE: 'lifecycle',
  RESOURCES: 'resources',
} as const

export type MetricStage = typeof MetricStages[keyof typeof MetricStages]

/**
 * Common correlation context for all metrics
 */
export interface MetricContext {
  executionId: string
  flowId?: string
  workerId?: string
  rootExecutionId?: string | null
  parentExecutionId?: string | null
  executionDepth?: number
  retryCount?: number
}

/**
 * Base metric event structure
 */
export interface BaseMetricEvent {
  stage: MetricStage
  event: string
  context: MetricContext
  timestamp: number
  duration_ms?: number
  error?: string
}

/**
 * Task queue operations metrics
 */
export interface TaskQueueMetric extends BaseMetricEvent {
  stage: typeof MetricStages.TASK_QUEUE
  event: 'publish' | 'consume' | 'ack' | 'retry' | 'publish_error' | 'consume_error'
  kafka_send_duration_ms?: number
  kafka_ack_wait_ms?: number
  queue_depth?: number
  consumer_lag?: number
  partition?: number
  offset?: number
  task_size_bytes?: number
  task_age_ms?: number
  serialization_ms?: number
  deserialization_ms?: number
  retry_count?: number
  retry_delay_ms?: number
}

/**
 * Worker claim operations metrics
 */
export interface ClaimMetric extends BaseMetricEvent {
  stage: typeof MetricStages.CLAIM
  event: 'attempt' | 'success' | 'conflict' | 'release' | 'heartbeat' | 'expired' | 'heartbeat_failed' | 'heartbeat_error' | 'release_after_error'
  claim_duration_ms?: number
  claim_attempts?: number
  claim_held_duration_ms?: number
  heartbeat_interval_ms?: number
  concurrent_workers?: number
  claim_queue_size?: number
}

/**
 * Flow loading metrics
 */
export interface FlowLoadMetric extends BaseMetricEvent {
  stage: typeof MetricStages.FLOW_LOAD
  event: 'start' | 'complete' | 'cache_hit' | 'cache_miss' | 'error'
  duration_ms?: number // Keep consistent with base interface
  load_duration_ms?: number // Additional specific field
  db_query_ms?: number
  deserialization_ms?: number
  flow_size_bytes?: number
  node_count?: number
  edge_count?: number
  cache_hit?: boolean
}

/**
 * Engine initialization metrics
 */
export interface InitMetric extends BaseMetricEvent {
  stage: typeof MetricStages.INIT
  event: 'context_create' | 'engine_create' | 'setup_complete' | 'error' | 'create_instance'
  total_init_ms?: number
  context_creation_ms?: number
  engine_creation_ms?: number
  event_handler_setup_ms?: number
  memory_allocated_mb?: number
  instance_count?: number
  node_count?: number
  edge_count?: number
}

/**
 * Event publishing metrics
 */
export interface EventPublishMetric extends BaseMetricEvent {
  stage: typeof MetricStages.EVENT_PUBLISH
  event: 'batch_start' | 'batch_complete' | 'publish_error' | 'subscription_create' | 'subscription_close' | 'batch_processed' | 'publish' | 'serialize'
  event_count?: number
  batch_size_bytes?: number
  publish_duration_ms?: number
  serialization_ms?: number
  kafka_send_ms?: number
  events_per_second?: number
  pending_publishes?: number
  topic?: string
  subscription_id?: string
  from_index?: number
  subscriptions_closed?: number
  skipped_count?: number
  batch_size?: number
  event_type?: string
  event_index?: number
  event_size_bytes?: number
}

/**
 * Child execution spawning metrics
 */
export interface ChildSpawnMetric extends BaseMetricEvent {
  stage: typeof MetricStages.CHILD_SPAWN
  event: 'spawn_start' | 'child_created' | 'task_published' | 'error' | 'spawn' | 'db_insert' | 'task_publish'
  parentExecutionId?: string
  childExecutionId?: string
  emittedEventType?: string
  total_spawn_ms?: number
  db_insert_ms?: number
  task_publish_ms?: number
  siblings_count?: number
  total_tree_size?: number
}

/**
 * Database operation metrics
 */
export interface DbOperationMetric extends BaseMetricEvent {
  stage: typeof MetricStages.DB_OPERATION
  event: 'query' | 'insert' | 'update' | 'delete' | 'transaction' | 'status_update_running' | 'status_update_completed'
  operation?: string
  query_duration_ms?: number
  rows_affected?: number
  transaction_duration_ms?: number
  pool_size?: number
  active_connections?: number
  waiting_requests?: number
}

/**
 * Task lifecycle summary metrics
 */
export interface LifecycleMetric extends BaseMetricEvent {
  stage: typeof MetricStages.LIFECYCLE
  event: 'task_start' | 'task_complete' | 'task_failed'
  total_duration_ms?: number
  breakdown?: {
    queue_wait?: number
    claim?: number
    flow_load?: number
    init?: number
    execution?: number
    event_publish?: number
    child_spawn?: number
    status_update?: number
    cleanup?: number
  }
  overhead_percentage?: number
}

/**
 * Resource usage metrics
 */
export interface ResourceMetric extends BaseMetricEvent {
  stage: typeof MetricStages.RESOURCES
  event: 'snapshot' | 'memory_snapshot' | 'heartbeat' | 'gc'
  cpu_usage_pct?: number
  memory_heap_used_mb?: number
  memory_heap_total_mb?: number
  memory_external_mb?: number
  memory_rss_mb?: number
  event_loop_lag_ms?: number
  pg_connections_active?: number
  pg_connections_idle?: number
  kafka_producer_queue_size?: number
  kafka_consumer_lag?: number
}

/**
 * Union type for all metric events
 */
export type MetricEvent
  = | TaskQueueMetric
    | ClaimMetric
    | FlowLoadMetric
    | InitMetric
    | EventPublishMetric
    | ChildSpawnMetric
    | DbOperationMetric
    | LifecycleMetric
    | ResourceMetric

/**
 * Metric operation for timing measurements
 */
export interface MetricOperation<T = any> {
  execute: () => Promise<T> | T
  stage: MetricStage
  event: string
  context: MetricContext
  metadata?: Record<string, any>
}

/**
 * Type guard functions
 */
export function isTaskQueueMetric(event: MetricEvent): event is TaskQueueMetric {
  return event.stage === MetricStages.TASK_QUEUE
}

export function isClaimMetric(event: MetricEvent): event is ClaimMetric {
  return event.stage === MetricStages.CLAIM
}

export function isFlowLoadMetric(event: MetricEvent): event is FlowLoadMetric {
  return event.stage === MetricStages.FLOW_LOAD
}

export function isInitMetric(event: MetricEvent): event is InitMetric {
  return event.stage === MetricStages.INIT
}

export function isEventPublishMetric(event: MetricEvent): event is EventPublishMetric {
  return event.stage === MetricStages.EVENT_PUBLISH
}

export function isChildSpawnMetric(event: MetricEvent): event is ChildSpawnMetric {
  return event.stage === MetricStages.CHILD_SPAWN
}

export function isDbOperationMetric(event: MetricEvent): event is DbOperationMetric {
  return event.stage === MetricStages.DB_OPERATION
}

export function isLifecycleMetric(event: MetricEvent): event is LifecycleMetric {
  return event.stage === MetricStages.LIFECYCLE
}

export function isResourceMetric(event: MetricEvent): event is ResourceMetric {
  return event.stage === MetricStages.RESOURCES
}
