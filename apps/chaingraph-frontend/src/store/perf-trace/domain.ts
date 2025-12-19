/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { createDomain } from 'effector'

/**
 * Effector domain for performance tracing stores.
 *
 * Contains:
 * - $rawTraces: Circular buffer of trace events
 * - $tracingEnabled: Toggle for enabling/disabling tracing
 * - $traceFilter: Filter configuration for trace queries
 * - $traceAggregations: Computed aggregations per operation
 * - $hotspots: Top slow operations sorted by impact
 */
export const perfTraceDomain = createDomain('perf-trace')
