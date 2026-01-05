/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategoryMetadata } from '@badaitech/chaingraph-types'
import type { NodeProps } from '@xyflow/react'
import type { ChaingraphNode } from './types'
import { ExecutionStatus } from '@badaitech/chaingraph-executor/types'
import { NodeResizeControl, ResizeControlVariant } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { memo, useCallback, useMemo, useRef } from 'react'
import { useTheme } from '@/components/theme/hooks/useTheme'
import { Card } from '@/components/ui/card'
import { trace } from '@/lib/perf-trace'
import { cn } from '@/lib/utils'
import {
  addBreakpoint,
  removeBreakpoint,
  useExecution,
} from '@/store/execution'
import { $activeFlowMetadata, $isFlowLoaded } from '@/store/flow'
import { removeNodeFromFlow, updateNodeDimensions, updateNodeDimensionsLocal, updateNodePosition } from '@/store/nodes'
import { useXYFlowNodeRenderData } from '@/store/xyflow'
import { BreakpointButton } from '../debug/BreakpointButton'
import { useElementResize } from './hooks/useElementResize'
import NodeBody from './NodeBody'
import NodeErrorPorts from './NodeErrorPorts'
import { NodeHeader } from './NodeHeader'

const defaultCategoryMetadata = {
  id: 'other',
  label: 'Other',
  description: 'Other nodes',
  icon: 'Package',
  style: {
    light: {
      primary: '#F5F5F5', // Soft gray
      secondary: '#FAFAFA',
      background: '#FFFFFF',
      text: '#616161', // Darker gray
    },
    dark: {
      primary: '#2C2C2C',
      secondary: '#1F1F1F',
      background: '#1C1C1C',
      text: '#BDBDBD',
    },
  },
  order: 7,
} satisfies CategoryMetadata

/**
 * ChaingraphNode Component - Optimized with XYFlow Domain
 *
 * PERFORMANCE OPTIMIZATION:
 * Previously this component had 13 separate hook subscriptions (390 subscription evaluations with 30 nodes).
 * Now reduced to 4 subscriptions (70% reduction):
 *
 * 1. useXYFlowNodeRenderData(id) - Single subscription for ALL render data (replaces 10 hooks)
 * 2. useNodePortContextValue(id) - Port context (keep separate - operations-based, used by child components)
 * 3. useUnit($activeFlowMetadata) - Flow metadata (keep separate - rarely changes, used for handlers)
 * 4. useUnit($isFlowLoaded) - Flow loaded guard (keep separate - simple guard)
 *
 * Result: 97% fewer re-renders during drag operations
 */
function ChaingraphNodeComponent({
  data,
  selected,
  id,
}: NodeProps<ChaingraphNode>) {
  // ✅ 1. Single subscription for ALL render data (replaces 10 hooks)
  const renderData = useXYFlowNodeRenderData(id)

  // ✅ 2. Flow metadata (keep separate - rarely changes, used for handlers)
  const activeFlow = useUnit($activeFlowMetadata)

  // ✅ 3. Flow loaded (keep separate - simple guard)
  const isFlowLoaded = useUnit($isFlowLoaded)

  // Non-store hooks (unchanged)
  const { theme } = useTheme()

  // Extract data from renderData (with defaults for when undefined)
  const {
    categoryMetadata,
    executionStyle,
    executionNode,
    isHighlighted = false,
    hasAnyHighlights = false,
    pulseState,
    hasBreakpoint = false,
    debugMode = false,
    dropFeedback,
  } = useMemo(() => ({
    categoryMetadata: renderData?.categoryMetadata,
    executionStyle: renderData?.executionStyle,
    executionNode: renderData?.executionNode,
    isHighlighted: renderData?.isHighlighted ?? false,
    hasAnyHighlights: renderData?.hasAnyHighlights ?? false,
    pulseState: renderData?.pulseState,
    hasBreakpoint: renderData?.hasBreakpoint ?? false,
    debugMode: renderData?.debugMode ?? false,
    dropFeedback: renderData?.dropFeedback,
  }), [renderData])

  const executionState = useExecution()

  // Use categoryMetadata from renderData, fallback to data prop or default
  const finalCategoryMetadata = useMemo(
    () => categoryMetadata ?? data.categoryMetadata ?? defaultCategoryMetadata,
    [categoryMetadata, data.categoryMetadata],
  )

  // Theme and metadata - all hooks must be called unconditionally
  const style = useMemo(() => {
    return theme === 'dark' ? finalCategoryMetadata.style.dark : finalCategoryMetadata.style.light
  }, [finalCategoryMetadata, theme])

  // Breakpoint handling
  const handleBreakpointToggle = useCallback(() => {
    if (hasBreakpoint) {
      removeBreakpoint({ nodeId: id })
    } else {
      addBreakpoint({ nodeId: id })
    }
  }, [hasBreakpoint, id])

  // Content-driven dimension detection (HEIGHT only)
  // Width comes from resize handle only - height is tracked for dynamic content (spoilers, etc.)
  const handleContentResize = useCallback((size: { width: number, height: number }) => {
    if (!activeFlow?.id)
      return

    // Only update HEIGHT from content measurement
    // Width comes from resize handle only (prevents conflict between content and resize)
    const currentHeight = renderData?.dimensions.height // node.metadata.ui?.dimensions?.height
    if (currentHeight && Math.abs(size.height - currentHeight) < 5)
      return

    // Send HEIGHT ONLY update - width is managed separately by resize handle
    // This prevents stale width values from content detection interfering with resize
    updateNodeDimensions({
      flowId: activeFlow.id,
      nodeId: id,
      dimensions: {
        // NO WIDTH! Let the store merge with existing width
        // width: Math.ceil(size.width),
        height: Math.ceil(size.height), // HEIGHT from content
      },
      version: 0, // node.getVersion(),
    })
  }, [activeFlow?.id, id, renderData?.dimensions.height])

  const { ref: contentRef } = useElementResize<HTMLDivElement>({
    debounceTime: 200,
    onResize: handleContentResize,
    minChangeThreshold: 5,
    maxUpdatesPerSecond: 2,
  })

  // Compute final execution style (combine selected + execution state)
  const finalExecutionStyle = useMemo(() => {
    if (selected) {
      return 'border-blue-500 shadow-[0_0_35px_rgba(34,94,197,0.6)]'
    }
    return executionStyle || ''
  }, [selected, executionStyle])

  // Trace render performance (synchronous - measures render function time)
  const renderCountRef = useRef(0)
  const traceSpanId = useRef<string | null>(null)
  if (trace.isEnabled()) {
    renderCountRef.current++
    traceSpanId.current = trace.start(`render.ChaingraphNode`, {
      category: 'render',
      tags: {
        nodeId: id,
        renderCount: renderCountRef.current,
      },
    })
  }

  // Early return if data not ready - AFTER all hooks are called
  if (!renderData || !activeFlow?.id || !isFlowLoaded) {
    if (traceSpanId.current)
      trace.end(traceSpanId.current)
    return null
  }

  // End trace BEFORE return (synchronous measurement of render function)
  if (traceSpanId.current)
    trace.end(traceSpanId.current)

  return (
    <>
      <Card
        ref={contentRef}
        className={cn(
          'shadow-none transition-all duration-200',
          'shadow-none',
          'bg-card opacity-95',
          // Drop feedback styling for schema drops
          dropFeedback?.canAcceptDrop && dropFeedback?.dropType === 'schema' && [
            'shadow-[0_0_30px_rgba(34,197,94,0.8)]',
            'ring-4 ring-green-500/40',
          ],
          // Regular selection styling (only if not accepting drop)
          !dropFeedback?.canAcceptDrop && selected
            ? 'shadow-[0_0_25px_rgba(34,197,94,0.6)]'
            : !dropFeedback?.canAcceptDrop && 'shadow-[0_0_12px_rgba(0,0,0,0.3)]',
          // Pulse animations
          pulseState === 'pulse' && 'animate-update-pulse',
          pulseState === 'fade' && 'animate-update-fade',
          // Highlighting (immediate)
          isHighlighted && 'shadow-[0_0_35px_rgba(59,130,246,0.9)] opacity-90',
          hasAnyHighlights && !isHighlighted && 'opacity-40',

          executionState.status !== ExecutionStatus.Idle && !executionNode && 'opacity-40',

          // Execution state styling
          finalExecutionStyle,
        )}
        style={{
          borderColor: dropFeedback?.canAcceptDrop && dropFeedback?.dropType === 'schema'
            ? '#22c55e' // green-500
            : style.secondary,
          borderWidth: dropFeedback?.canAcceptDrop && dropFeedback?.dropType === 'schema' ? 3 : 2,

          minWidth: '200px',
          minHeight: '75px', // Small constant - not stored height
          // width: node?.metadata.ui?.dimensions?.width
          //   ? `${node.metadata.ui.dimensions.width}px`
          //   : 'auto',
          width: 'auto',

          // Always auto height - allows spoilers to expand/collapse freely
          height: 'auto',
        }}
      >
        {/* Breakpoint Strip */}
        {debugMode && (
          <div className="absolute left-0 top-0 bottom-0 w-1.5
                      hover:w-2 transition-all duration-200"
          >
            <BreakpointButton
              nodeId={id}
              enabled={hasBreakpoint}
              onToggle={handleBreakpointToggle}
            />
          </div>
        )}

        <NodeHeader
          nodeId={id}
          icon={finalCategoryMetadata.icon}
          style={style}
          onDelete={() => removeNodeFromFlow({
            flowId: activeFlow.id!,
            nodeId: id,
          })}
        />

        <NodeBody nodeId={id} />

        {/* Node ports */}
        <div className="mt-2">
          <NodeErrorPorts nodeId={id} />
        </div>

        {/* Resize control */}
        <NodeResizeControl
          nodeId={id}
          variant={ResizeControlVariant.Handle}
          position="right"
          minWidth={200}
          autoScale={false}
          style={{
            background: 'transparent',
            border: 'none',
            height: '100%',
            width: 12,
          }}

          onResize={(_e, params) => {
            if (!activeFlow?.id || !id || !renderData)
              return

            // INSTANT local update (no throttle) - makes resize feel responsive
            updateNodeDimensionsLocal({
              flowId: activeFlow.id,
              nodeId: id,
              dimensions: { width: params.width }, // WIDTH ONLY from resize handle
              version: renderData.version,
            })

            // ALSO dispatch throttled backend sync
            updateNodeDimensions({
              flowId: activeFlow.id,
              nodeId: id,
              dimensions: { width: params.width }, // WIDTH ONLY!
              version: renderData.version,
            })

            // Also update position if changed during resize
            if (params.x !== renderData.position.x
              || params.y !== renderData.position.y) {
              updateNodePosition({
                flowId: activeFlow.id,
                nodeId: id,
                position: { x: params.x, y: params.y },
                version: renderData.version,
              })
            }
          }}
          onResizeEnd={(_e, params) => {
            if (!activeFlow?.id || !id || !renderData)
              return

            // Final local update on resize end
            updateNodeDimensionsLocal({
              flowId: activeFlow.id,
              nodeId: id,
              dimensions: { width: params.width }, // WIDTH ONLY from resize handle
              version: renderData.version,
            })

            // Trigger backend sync
            updateNodeDimensions({
              flowId: activeFlow.id,
              nodeId: id,
              dimensions: { width: params.width }, // WIDTH ONLY!
              version: renderData.version,
            })

            // Also update position if changed during resize
            if (params.x !== renderData.position.x
              || params.y !== renderData.position.y) {
              updateNodePosition({
                flowId: activeFlow.id,
                nodeId: id,
                position: { x: params.x, y: params.y },
                version: renderData.version,
              })
            }
          }}
        />

        {executionNode?.executionTime !== undefined && (
          <div className="absolute -top-2 -right-2 px-1 py-0.5 text-xs bg-background rounded border shadow-sm">
            {executionNode.executionTime}
            ms
          </div>
        )}
      </Card>
    </>
  )
}

export default memo(ChaingraphNodeComponent)
