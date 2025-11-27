/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { DBType, IFlowStore } from '@badaitech/chaingraph-trpc/server'
import type { Flow } from '@badaitech/chaingraph-types'
import type { FlowLoadMetric } from '../metrics'
import { DBFlowStore, PgOwnershipResolver } from '@badaitech/chaingraph-trpc/server'
import { NodeRegistry } from '@badaitech/chaingraph-types'
import { createMetricsTracker, MetricsHelper, MetricStages } from '../metrics'
import { getDatabaseMain } from '../utils/db'
import { createLogger } from '../utils/logger'
import { getUserStore } from './user-store'

const logger = createLogger('flow-store')

// Metrics tracking
const metrics = createMetricsTracker('flow-store')
const metricsHelper = new MetricsHelper(metrics)

let flowStore: DBFlowStore | null = null

export async function getFlowStore(
  db?: DBType,
): Promise<IFlowStore> {
  if (!flowStore) {
    const _db = db ?? await getDatabaseMain()
    const userStore = await getUserStore()
    const ownershipResolver = new PgOwnershipResolver(userStore)
    flowStore = new DBFlowStore(_db, false, NodeRegistry.getInstance(), ownershipResolver)
  }
  return flowStore
}

export async function loadFlow(flowId: string): Promise<Flow | null> {
  const scopedMetrics = metrics.withContext({
    executionId: 'flow-load',
    flowId,
  })

  const loadTimer = metricsHelper.createTimer(MetricStages.FLOW_LOAD, 'load')
  const store = await getFlowStore()

  // Track database query time
  const dbTimer = metricsHelper.createTimer(MetricStages.FLOW_LOAD, 'db_query')
  const flow = await store.getFlow(flowId)
  const dbQueryTime = dbTimer.end()

  const totalLoadTime = loadTimer.end()

  if (!flow) {
    logger.warn({ flowId }, 'Flow not found')

    // Track cache miss / not found
    scopedMetrics.track({
      stage: MetricStages.FLOW_LOAD,
      event: 'error',
      timestamp: Date.now(),
      load_duration_ms: totalLoadTime,
      db_query_ms: dbQueryTime,
      cache_hit: false,
      error: 'Flow not found',
    } as FlowLoadMetric)

    return null
  }

  // Track successful load with flow characteristics
  scopedMetrics.track({
    stage: MetricStages.FLOW_LOAD,
    event: 'complete',
    timestamp: Date.now(),
    load_duration_ms: totalLoadTime,
    db_query_ms: dbQueryTime,
    node_count: flow.nodes.size,
    edge_count: flow.edges.size,
    cache_hit: false, // Currently no cache, always database fetch
  } as FlowLoadMetric)

  return flow
}
