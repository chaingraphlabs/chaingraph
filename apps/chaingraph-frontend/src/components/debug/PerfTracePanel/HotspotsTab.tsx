/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { TraceHotspot } from '@/lib/perf-trace'
import { useUnit } from 'effector-react'
import { useCallback, useMemo, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { $hotspots, $selectedOperation, selectOperation } from '@/store/perf-trace'

type SortKey = 'impact' | 'count' | 'avg' | 'p95' | 'max'

/**
 * Format milliseconds for display
 */
function formatMs(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`
  }
  if (ms >= 1) {
    return `${ms.toFixed(2)}ms`
  }
  return `${(ms * 1000).toFixed(0)}us`
}

/**
 * Get impact level color based on duration
 */
function getImpactColor(avgMs: number): string {
  if (avgMs >= 16.67)
    return 'text-red-500' // > 1 frame
  if (avgMs >= 8)
    return 'text-orange-500' // > half frame
  if (avgMs >= 2)
    return 'text-yellow-500' // noticeable
  return 'text-green-500' // good
}

/**
 * Get impact bar width (relative to max impact)
 */
function getImpactBarWidth(impact: number, maxImpact: number): number {
  if (maxImpact === 0)
    return 0
  return Math.round((impact / maxImpact) * 100)
}

export function HotspotsTab() {
  const [hotspots, selectedOperation] = useUnit([$hotspots, $selectedOperation])
  const [sortKey, setSortKey] = useState<SortKey>('impact')
  const [sortAsc, setSortAsc] = useState(false)

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }, [sortKey, sortAsc])

  const handleSelect = useCallback((name: string) => {
    selectOperation(selectedOperation === name ? null : name)
  }, [selectedOperation])

  const sortedHotspots = useMemo(() => {
    const sorted = [...hotspots].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      return sortAsc ? aVal - bVal : bVal - aVal
    })
    return sorted
  }, [hotspots, sortKey, sortAsc])

  const maxImpact = useMemo(() => {
    return Math.max(...hotspots.map(h => h.impact), 1)
  }, [hotspots])

  if (hotspots.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No traces recorded yet. Start performing actions to collect data.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center px-3 py-2 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground">
        <div className="w-[300px] cursor-pointer" onClick={() => handleSort('impact')}>
          Operation
          {sortKey === 'impact' && (sortAsc ? ' ↑' : ' ↓')}
        </div>
        <div className="w-[80px] text-right cursor-pointer" onClick={() => handleSort('count')}>
          Count
          {sortKey === 'count' && (sortAsc ? ' ↑' : ' ↓')}
        </div>
        <div className="w-[80px] text-right cursor-pointer" onClick={() => handleSort('impact')}>
          Total
          {sortKey === 'impact' && (sortAsc ? ' ↑' : ' ↓')}
        </div>
        <div className="w-[80px] text-right cursor-pointer" onClick={() => handleSort('avg')}>
          Avg
          {sortKey === 'avg' && (sortAsc ? ' ↑' : ' ↓')}
        </div>
        <div className="w-[80px] text-right cursor-pointer" onClick={() => handleSort('p95')}>
          P95
          {sortKey === 'p95' && (sortAsc ? ' ↑' : ' ↓')}
        </div>
        <div className="w-[80px] text-right cursor-pointer" onClick={() => handleSort('max')}>
          Max
          {sortKey === 'max' && (sortAsc ? ' ↑' : ' ↓')}
        </div>
        <div className="flex-1 pl-3">
          Impact
        </div>
      </div>

      {/* Rows */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border">
          {sortedHotspots.map(hotspot => (
            <HotspotRow
              key={hotspot.name}
              hotspot={hotspot}
              maxImpact={maxImpact}
              isSelected={selectedOperation === hotspot.name}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

interface HotspotRowProps {
  hotspot: TraceHotspot
  maxImpact: number
  isSelected: boolean
  onSelect: (name: string) => void
}

function HotspotRow({ hotspot, maxImpact, isSelected, onSelect }: HotspotRowProps) {
  const impactColor = getImpactColor(hotspot.avg)
  const barWidth = getImpactBarWidth(hotspot.impact, maxImpact)

  return (
    <div
      className={cn(
        'flex items-center px-3 py-2 text-xs hover:bg-muted/50 cursor-pointer transition-colors',
        isSelected && 'bg-muted',
      )}
      onClick={() => onSelect(hotspot.name)}
    >
      {/* Name */}
      <div className="w-[300px] truncate">
        <span className={cn('font-mono', impactColor)}>
          {hotspot.name}
        </span>
        <span className="ml-2 text-muted-foreground">
          [
          {hotspot.category}
          ]
        </span>
      </div>

      {/* Count */}
      <div className="w-[80px] text-right tabular-nums">
        {hotspot.count.toLocaleString()}
      </div>

      {/* Total */}
      <div className="w-[80px] text-right tabular-nums">
        {formatMs(hotspot.sum)}
      </div>

      {/* Avg */}
      <div className={cn('w-[80px] text-right tabular-nums', impactColor)}>
        {formatMs(hotspot.avg)}
      </div>

      {/* P95 */}
      <div className="w-[80px] text-right tabular-nums">
        {formatMs(hotspot.p95)}
      </div>

      {/* Max */}
      <div className="w-[80px] text-right tabular-nums">
        {formatMs(hotspot.max)}
      </div>

      {/* Impact bar */}
      <div className="flex-1 pl-3">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              hotspot.avg >= 16.67
                ? 'bg-red-500'
                : hotspot.avg >= 8
                  ? 'bg-orange-500'
                  : hotspot.avg >= 2
                    ? 'bg-yellow-500'
                    : 'bg-green-500',
            )}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
    </div>
  )
}
