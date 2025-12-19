/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useUnit } from 'effector-react'
import { Download, Pause, Play, Trash2 } from 'lucide-react'
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { trace } from '@/lib/perf-trace'
import {
  $traceCount,
  $tracingEnabled,
  clearTraces,
  toggleTracing,
} from '@/store/perf-trace'

interface TraceControlsProps {
  onExport?: () => void
}

export function TraceControls({ onExport }: TraceControlsProps) {
  const [enabled, traceCount] = useUnit([$tracingEnabled, $traceCount])

  const handleToggle = useCallback((checked: boolean) => {
    toggleTracing(checked)
    trace.setEnabled(checked)
  }, [])

  const handleClear = useCallback(() => {
    clearTraces()
  }, [])

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport()
    }
  }, [onExport])

  return (
    <div className="flex items-center gap-4 p-2 border-b border-border bg-muted/50">
      {/* Toggle */}
      <div className="flex items-center gap-2">
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          id="trace-toggle"
        />
        <label
          htmlFor="trace-toggle"
          className="text-sm font-medium cursor-pointer flex items-center gap-1"
        >
          {enabled
            ? (
              <>
                <Play className="w-3 h-3 text-green-500" />
                Recording
              </>
            )
            : (
              <>
                <Pause className="w-3 h-3 text-muted-foreground" />
                Paused
              </>
            )}
        </label>
      </div>

      {/* Trace count */}
      <div className="text-sm text-muted-foreground">
        {traceCount.toLocaleString()}
        {' '}
        traces
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={traceCount === 0}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Clear
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={traceCount === 0}
        >
          <Download className="w-4 h-4 mr-1" />
          Export JSON
        </Button>
      </div>
    </div>
  )
}
