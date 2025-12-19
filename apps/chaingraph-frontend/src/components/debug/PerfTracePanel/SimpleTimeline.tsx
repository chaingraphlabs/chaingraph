/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useUnit } from 'effector-react'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { $timelineData, $traceTimeRange } from '@/store/perf-trace'

/**
 * Category colors for timeline bars
 */
const CATEGORY_COLORS: Record<string, string> = {
  store: 'bg-blue-500',
  event: 'bg-purple-500',
  effect: 'bg-pink-500',
  sample: 'bg-cyan-500',
  render: 'bg-green-500',
  hook: 'bg-lime-500',
  compute: 'bg-orange-500',
  io: 'bg-red-500',
  custom: 'bg-gray-500',
}

/**
 * Format time for axis labels
 */
function formatTime(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)}s`
  }
  return `${Math.round(ms)}ms`
}

export function SimpleTimeline() {
  const [timelineData, timeRange] = useUnit([$timelineData, $traceTimeRange])

  const maxCount = useMemo(() => {
    return Math.max(...timelineData.buckets.map(b => b.count), 1)
  }, [timelineData.buckets])

  const maxDuration = useMemo(() => {
    return Math.max(...timelineData.buckets.map(b => b.totalDuration), 1)
  }, [timelineData.buckets])

  if (timelineData.buckets.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No timeline data available.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full p-4">
      {/* Header with time range */}
      <div className="flex items-center justify-between mb-4 text-xs text-muted-foreground">
        <span>
          Time range:
          {' '}
          {formatTime(timeRange.duration)}
        </span>
        <div className="flex items-center gap-4">
          {/* Legend */}
          {Object.entries(CATEGORY_COLORS).slice(0, 6).map(([category, color]) => (
            <div key={category} className="flex items-center gap-1">
              <div className={cn('w-2 h-2 rounded-sm', color)} />
              <span>{category}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline chart */}
      <div className="flex-1 flex flex-col">
        {/* Count chart (top) */}
        <div className="flex-1 flex items-end gap-[1px] min-h-[60px] bg-muted/20 rounded">
          {timelineData.buckets.map((bucket, index) => {
            const heightPercent = (bucket.count / maxCount) * 100
            const heightPx = Math.max(heightPercent / 100 * 60, bucket.count > 0 ? 2 : 0)

            // Get dominant category for color
            let dominantCategory = 'custom'
            let maxCatCount = 0
            for (const [cat, count] of Object.entries(bucket.categories)) {
              if (count > maxCatCount) {
                maxCatCount = count
                dominantCategory = cat
              }
            }

            return (
              <div
                key={index}
                className="flex-1 flex flex-col justify-end"
                title={`Bucket ${index}: ${bucket.count} traces, ${bucket.totalDuration.toFixed(2)}ms total, category: ${dominantCategory}`}
              >
                {bucket.count > 0 && (
                  <div
                    className={cn(
                      'w-full rounded-t-sm transition-all',
                      CATEGORY_COLORS[dominantCategory] || CATEGORY_COLORS.custom,
                      'opacity-80 hover:opacity-100',
                    )}
                    style={{ height: `${heightPx}px` }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Time axis */}
        <div className="flex justify-between pt-2 text-[10px] text-muted-foreground border-t border-border mt-1">
          <span>{formatTime(0)}</span>
          <span>{formatTime(timeRange.duration / 4)}</span>
          <span>{formatTime(timeRange.duration / 2)}</span>
          <span>{formatTime((timeRange.duration / 4) * 3)}</span>
          <span>{formatTime(timeRange.duration)}</span>
        </div>
      </div>

      {/* Duration chart (bottom) - shows total duration per bucket */}
      <div className="mt-4">
        <div className="text-xs text-muted-foreground mb-2">Total Duration per Time Slice</div>
        <div className="flex items-end gap-[1px] h-[40px] bg-muted/20 rounded">
          {timelineData.buckets.map((bucket, index) => {
            const heightPercent = (bucket.totalDuration / maxDuration) * 100
            const heightPx = Math.max(heightPercent / 100 * 40, bucket.totalDuration > 0 ? 2 : 0)

            // Color based on duration severity
            const color
              = bucket.totalDuration >= 16.67
                ? 'bg-red-500'
                : bucket.totalDuration >= 8
                  ? 'bg-orange-500'
                  : bucket.totalDuration >= 2
                    ? 'bg-yellow-500'
                    : 'bg-green-500'

            return (
              <div
                key={index}
                className="flex-1 flex flex-col justify-end"
                title={`Bucket ${index}: ${bucket.totalDuration.toFixed(2)}ms total`}
              >
                {bucket.totalDuration > 0 && (
                  <div
                    className={cn(
                      'w-full rounded-t-sm transition-all',
                      color,
                      'opacity-80 hover:opacity-100',
                    )}
                    style={{ height: `${heightPx}px` }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary stats */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border text-xs">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-muted-foreground">Total traces: </span>
            <span className="font-medium">
              {timelineData.buckets.reduce((sum, b) => sum + b.count, 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Total duration: </span>
            <span className="font-medium">
              {formatTime(timelineData.buckets.reduce((sum, b) => sum + b.totalDuration, 0))}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="w-2 h-2 rounded-sm bg-green-500" />
          &lt;2ms
          <span className="w-2 h-2 rounded-sm bg-yellow-500 ml-2" />
          2-8ms
          <span className="w-2 h-2 rounded-sm bg-orange-500 ml-2" />
          8-16ms
          <span className="w-2 h-2 rounded-sm bg-red-500 ml-2" />
          &gt;16ms
        </div>
      </div>
    </div>
  )
}
