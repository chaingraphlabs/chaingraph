/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { TraceAggregation, TraceEvent, TraceHotspot, TraceTree } from '@/lib/perf-trace'
import { combine } from 'effector'
import { $rawTraces, $selectedOperation, $traceFilter } from './stores'

/**
 * Calculate percentile from sorted array
 */
function percentile(sortedArr: number[], p: number): number {
  if (sortedArr.length === 0) return 0
  const index = Math.ceil((p / 100) * sortedArr.length) - 1
  return sortedArr[Math.max(0, Math.min(index, sortedArr.length - 1))]
}

/**
 * Filtered traces based on current filter settings
 */
export const $filteredTraces = combine(
  $rawTraces,
  $traceFilter,
  (traces, filter) => {
    return traces.filter((t) => {
      // Filter by category
      if (filter.categories && !filter.categories.includes(t.category)) {
        return false
      }

      // Filter by name pattern
      if (filter.namePattern && !t.name.includes(filter.namePattern)) {
        return false
      }

      // Filter by minimum duration
      if (filter.minDuration > 0 && (t.duration ?? 0) < filter.minDuration) {
        return false
      }

      // Filter by time range
      if (filter.timeRange) {
        if (t.startTime < filter.timeRange.start || t.startTime > filter.timeRange.end) {
          return false
        }
      }

      return true
    })
  },
)

/**
 * Build trace tree for hierarchical visualization
 */
export const $traceTree = $filteredTraces.map((traces): TraceTree => {
  const byId = new Map<string, TraceEvent>()
  const roots: TraceEvent[] = []
  const children = new Map<string, TraceEvent[]>()

  for (const trace of traces) {
    byId.set(trace.id, trace)

    if (!trace.parentId) {
      roots.push(trace)
    }
    else {
      const siblings = children.get(trace.parentId) ?? []
      siblings.push(trace)
      children.set(trace.parentId, siblings)
    }
  }

  return { roots, children, byId }
})

/**
 * Aggregations per operation name
 */
export const $traceAggregations = $filteredTraces.map((traces): TraceAggregation[] => {
  const byName = new Map<string, {
    name: string
    category: TraceAggregation['category']
    count: number
    sum: number
    min: number
    max: number
    durations: number[]
  }>()

  for (const trace of traces) {
    // Only aggregate completed spans with duration
    if (trace.duration === null) continue

    let agg = byName.get(trace.name)
    if (!agg) {
      agg = {
        name: trace.name,
        category: trace.category,
        count: 0,
        sum: 0,
        min: Infinity,
        max: -Infinity,
        durations: [],
      }
      byName.set(trace.name, agg)
    }

    agg.count++
    agg.sum += trace.duration
    agg.min = Math.min(agg.min, trace.duration)
    agg.max = Math.max(agg.max, trace.duration)
    agg.durations.push(trace.duration)
  }

  // Calculate percentiles and averages
  return Array.from(byName.values()).map((agg) => {
    // Sort durations for percentile calculation
    const sorted = [...agg.durations].sort((a, b) => a - b)

    return {
      name: agg.name,
      category: agg.category,
      count: agg.count,
      sum: agg.sum,
      min: agg.min === Infinity ? 0 : agg.min,
      max: agg.max === -Infinity ? 0 : agg.max,
      avg: agg.count > 0 ? agg.sum / agg.count : 0,
      p50: percentile(sorted, 50),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
      durations: agg.durations,
    }
  })
})

/**
 * Top hotspots sorted by impact (total time spent)
 */
export const $hotspots = $traceAggregations.map((aggs): TraceHotspot[] => {
  return [...aggs]
    .map(agg => ({
      ...agg,
      impact: agg.sum, // Impact = total time spent
    }))
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 20) // Top 20 hotspots
})

/**
 * Stats for the currently selected operation
 */
export const $selectedOperationStats = combine(
  $traceAggregations,
  $selectedOperation,
  (aggs, selected) => {
    if (!selected) return null
    return aggs.find(a => a.name === selected) ?? null
  },
)

/**
 * Distribution buckets for the selected operation
 */
export const $selectedOperationDistribution = $selectedOperationStats.map((stats) => {
  if (!stats || stats.durations.length === 0) {
    return []
  }

  // Create distribution buckets
  const buckets = [
    { label: '0-0.5ms', min: 0, max: 0.5, count: 0 },
    { label: '0.5-1ms', min: 0.5, max: 1, count: 0 },
    { label: '1-2ms', min: 1, max: 2, count: 0 },
    { label: '2-5ms', min: 2, max: 5, count: 0 },
    { label: '5-10ms', min: 5, max: 10, count: 0 },
    { label: '10-20ms', min: 10, max: 20, count: 0 },
    { label: '20ms+', min: 20, max: Infinity, count: 0 },
  ]

  for (const duration of stats.durations) {
    for (const bucket of buckets) {
      if (duration >= bucket.min && duration < bucket.max) {
        bucket.count++
        break
      }
    }
  }

  const total = stats.durations.length
  return buckets.map(b => ({
    ...b,
    percentage: total > 0 ? (b.count / total) * 100 : 0,
  }))
})

/**
 * Timeline data for visualization
 * Groups traces into time buckets for rendering
 */
export const $timelineData = $filteredTraces.map((traces) => {
  if (traces.length === 0) {
    return { buckets: [], minTime: 0, maxTime: 0 }
  }

  // Sort traces by startTime first
  const sorted = [...traces].sort((a, b) => a.startTime - b.startTime)

  // Find time range
  const minTime = sorted[0].startTime
  const maxTime = sorted[sorted.length - 1].startTime

  // Create 100 buckets across the time range
  const bucketCount = 100
  // Use minimum 100ms bucket duration to avoid all traces in one bucket
  const timeRange = Math.max(maxTime - minTime, 100)
  const bucketDuration = timeRange / bucketCount

  const buckets: Array<{
    time: number
    count: number
    totalDuration: number
    categories: Record<string, number>
  }> = []

  for (let i = 0; i < bucketCount; i++) {
    buckets.push({
      time: minTime + (i * bucketDuration),
      count: 0,
      totalDuration: 0,
      categories: {},
    })
  }

  // Populate buckets (use sorted traces)
  for (const trace of sorted) {
    const bucketIndex = Math.min(
      Math.floor((trace.startTime - minTime) / bucketDuration),
      bucketCount - 1,
    )

    if (bucketIndex >= 0 && bucketIndex < buckets.length) {
      buckets[bucketIndex].count++
      buckets[bucketIndex].totalDuration += trace.duration ?? 0
      buckets[bucketIndex].categories[trace.category]
        = (buckets[bucketIndex].categories[trace.category] ?? 0) + 1
    }
  }

  return { buckets, minTime, maxTime: minTime + timeRange }
})
