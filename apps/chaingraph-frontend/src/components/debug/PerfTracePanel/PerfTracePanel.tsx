/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useUnit } from 'effector-react'
import { Activity, ChevronDown, ChevronUp } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { $rawTraces } from '@/store/perf-trace'
import { HotspotsTab } from './HotspotsTab'
import { SimpleTimeline } from './SimpleTimeline'
import { TraceControls } from './TraceControls'

interface PerfTracePanelProps {
  className?: string
  defaultExpanded?: boolean
  defaultHeight?: number
}

/**
 * Dockable performance trace panel.
 *
 * Displays at the bottom of the viewport with:
 * - Toggle to expand/collapse
 * - Hotspots tab (sortable table of slow operations)
 * - Timeline tab (trace distribution over time)
 * - Controls for recording, clearing, exporting
 */
export function PerfTracePanel({
  className,
  defaultExpanded = false,
  defaultHeight = 300,
}: PerfTracePanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [height, setHeight] = useState(defaultHeight)
  const [isDragging, setIsDragging] = useState(false)

  const rawTraces = useUnit($rawTraces)

  const handleToggle = useCallback(() => {
    setExpanded(prev => !prev)
  }, [])

  const handleExport = useCallback(() => {
    const data = JSON.stringify(rawTraces, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `perf-traces-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [rawTraces])

  // Resize handle drag
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)

    const startY = e.clientY
    const startHeight = height

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY
      const newHeight = Math.max(150, Math.min(600, startHeight + deltaY))
      setHeight(newHeight)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [height])

  // Only show in dev mode
  if (!import.meta.env.DEV) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg transition-all',
        isDragging && 'select-none',
        className,
      )}
      style={{ height: expanded ? height : 36 }}
    >
      {/* Resize handle */}
      {expanded && (
        <div
          className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize bg-transparent hover:bg-primary/20 transition-colors"
          onMouseDown={handleResizeStart}
        />
      )}

      {/* Header bar (always visible) */}
      <div
        className="flex items-center h-9 px-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={handleToggle}
      >
        <Activity className="w-4 h-4 mr-2 text-primary" />
        <span className="text-sm font-medium">Performance Traces</span>
        <span className="ml-2 text-xs text-muted-foreground">
          (
          {rawTraces.length.toLocaleString()}
          {' '}
          traces)
        </span>
        <div className="flex-1" />
        {expanded
          ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
          : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
      </div>

      {/* Panel content */}
      {expanded && (
        <div className="flex flex-col" style={{ height: height - 36 }}>
          <TraceControls onExport={handleExport} />

          <Tabs defaultValue="hotspots" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-fit mx-3 mt-2">
              <TabsTrigger value="hotspots">Hotspots</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="hotspots" className="flex-1 overflow-hidden mt-0">
              <HotspotsTab />
            </TabsContent>

            <TabsContent value="timeline" className="flex-1 overflow-hidden mt-0">
              <SimpleTimeline />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
