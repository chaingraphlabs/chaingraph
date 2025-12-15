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
import { NodeResizeControl, ResizeControlVariant } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { memo, useCallback, useMemo } from 'react'
import { mergeNodePortsUi } from '@/components/flow/nodes/ChaingraphNode/utils/merge-nodes'
import { useTheme } from '@/components/theme/hooks/useTheme'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useNodeDropFeedback } from '@/store/drag-drop'
import {
  $executionState,
  addBreakpoint,
  removeBreakpoint,
} from '@/store/execution'
import { useBreakpoint } from '@/store/execution/hooks/useBreakpoint'
import { useNodeExecution } from '@/store/execution/hooks/useNodeExecution'
import { $activeFlowMetadata, $isFlowLoaded } from '@/store/flow'
import { removeNodeFromFlow, updateNodeDimensions, updateNodeDimensionsLocal, updateNodePosition } from '@/store/nodes'
import {
  useHasHighlightedNodes,
  useIsNodeHighlighted,
  useNodeExecutionStyle,
  useNodePortContextValue,
} from '@/store/nodes/computed'
import { useNode } from '@/store/nodes/hooks/useNode'
import { useNodePulseState } from '@/store/updates'
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

function ChaingraphNodeComponent({
  data,
  selected,
  id,
}: NodeProps<ChaingraphNode>) {
  // Optimized granular hooks - only subscribe to what we need
  const node = useNode(id)
  const parentNode = useNode(node?.metadata.parentNodeId || '')
  const nodeExecution = useNodeExecution(id)
  const executionStyle = useNodeExecutionStyle(id)
  const portContext = useNodePortContextValue(id) // Now returns PortContextValue, not undefined
  const nodePulseState = useNodePulseState(id)
  const isHighlighted = useIsNodeHighlighted(id)
  const hasHighlights = useHasHighlightedNodes()
  const dropFeedback = useNodeDropFeedback(id)
  const isBreakpointSet = useBreakpoint(id)

  // Only these need useUnit (minimal subscriptions)
  const activeFlow = useUnit($activeFlowMetadata)
  const { debugMode } = useUnit($executionState)
  const isFlowLoaded = useUnit($isFlowLoaded)

  // Debug: Track changes in hook values
  // useWhyDidYouUpdate(`Node-${id}-hooks`, {
  //   nodeVersion: node?.getVersion(),
  //   executionStyle: executionStyle?.className,
  //   pulseState: nodePulseState,
  //   isHighlighted,
  //   hasHighlights,
  //   dropFeedback: dropFeedback?.canAcceptDrop,
  //   isBreakpointSet,
  //   debugMode,
  // })

  // Theme and metadata
  const { theme } = useTheme()

  const categoryMetadata = data.categoryMetadata ?? defaultCategoryMetadata
  const style = useMemo(() => {
    return theme === 'dark' ? categoryMetadata.style.dark : categoryMetadata.style.light
  }, [categoryMetadata, theme])

  // Breakpoint handling
  const handleBreakpointToggle = useCallback(() => {
    if (isBreakpointSet) {
      removeBreakpoint({ nodeId: id })
    } else {
      addBreakpoint({ nodeId: id })
    }
  }, [isBreakpointSet, id])

  // Content-driven dimension detection (HEIGHT only)
  // Width comes from resize handle only - height is tracked for dynamic content (spoilers, etc.)
  const handleContentResize = useCallback((size: { width: number, height: number }) => {
    if (!activeFlow?.id || !node)
      return

    // Only update HEIGHT from content measurement
    // Width comes from resize handle only (prevents conflict between content and resize)
    const currentHeight = node.metadata.ui?.dimensions?.height
    if (currentHeight && Math.abs(size.height - currentHeight) < 5)
      return

    // Send HEIGHT ONLY update - width is managed separately by resize handle
    // This prevents stale width values from content detection interfering with resize
    updateNodeDimensions({
      flowId: activeFlow.id,
      nodeId: id,
      dimensions: {
        // NO WIDTH! Let the store merge with existing width
        height: Math.ceil(size.height), // HEIGHT from content
      },
      version: node.getVersion(),
    })
  }, [activeFlow?.id, node, id])

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
    return executionStyle?.className || ''
  }, [selected, executionStyle])

  // Merged node for rendering (execution node or regular node)
  const nodeToRender = useMemo(() => {
    return nodeExecution?.node ? mergeNodePortsUi(nodeExecution.node, node!) : node
  }, [node, nodeExecution])

  if (!activeFlow || !activeFlow.id || !nodeToRender)
    return null

  return (
    <>
      <Card
        ref={contentRef}
        className={cn(
          'shadow-none transition-all duration-200',
          'bg-card opacity-95',
          '',
          // Drop feedback styling for schema drops
          dropFeedback?.canAcceptDrop && dropFeedback?.dropType === 'schema' && [
            'shadow-[0_0_30px_rgba(34,197,94,0.8)]',
            'ring-4 ring-green-500/40',
          ],
          // Regular selection styling (only if not accepting drop)
          !dropFeedback?.canAcceptDrop && selected
            ? 'shadow-[0_0_25px_rgba(34,197,94,0.6)]'
            : !dropFeedback?.canAcceptDrop && 'shadow-[0_0_12px_rgba(0,0,0,0.3)]',
          // Execution state styling
          finalExecutionStyle,
          // Pulse animations
          nodePulseState === 'pulse' && 'animate-update-pulse',
          nodePulseState === 'fade' && 'animate-update-fade',
          // Highlighting
          isHighlighted && 'shadow-[0_0_35px_rgba(59,130,246,0.9)] opacity-90',
          hasHighlights && !isHighlighted && 'opacity-40',
        )}
        style={{
          borderColor: dropFeedback?.canAcceptDrop && dropFeedback?.dropType === 'schema'
            ? '#22c55e' // green-500
            : style.secondary,
          borderWidth: dropFeedback?.canAcceptDrop && dropFeedback?.dropType === 'schema' ? 3 : 2,

          minWidth: '200px',
          minHeight: '75px', // Small constant - not stored height
          width: node?.metadata.ui?.dimensions?.width
            ? `${node.metadata.ui.dimensions.width}px`
            : 'auto',
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
              nodeId={nodeToRender.id}
              enabled={isBreakpointSet}
              onToggle={handleBreakpointToggle}
            />
          </div>
        )}

        <NodeHeader
          node={nodeToRender}
          context={portContext}
          icon={categoryMetadata.icon}
          style={style}
          categoryMetadata={categoryMetadata}
          onDelete={() => removeNodeFromFlow({
            flowId: activeFlow.id!,
            nodeId: id,
          })}
          debugMode={debugMode}
          isBreakpointSet={isBreakpointSet}
          onBreakpointToggle={handleBreakpointToggle}
        />

        <NodeBody
          node={nodeToRender}
          context={portContext}
        />

        {/* Node ports */}

        {(!parentNode || (parentNode.metadata.category === 'group')) && (
          <div className="mt-2">
            <NodeErrorPorts
              node={nodeToRender}
              context={portContext}
            />
          </div>
        )}

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
            if (!activeFlow?.id || !id || !node)
              return

            // INSTANT local update (no throttle) - makes resize feel responsive
            updateNodeDimensionsLocal({
              flowId: activeFlow.id,
              nodeId: id,
              dimensions: { width: params.width }, // WIDTH ONLY from resize handle
              version: node.getVersion(),
            })

            // ALSO dispatch throttled backend sync
            updateNodeDimensions({
              flowId: activeFlow.id,
              nodeId: id,
              dimensions: { width: params.width }, // WIDTH ONLY!
              version: node.getVersion(),
            })

            // Also update position if changed during resize
            if (params.x !== node.metadata.ui?.position?.x
              || params.y !== node.metadata.ui?.position?.y) {
              updateNodePosition({
                flowId: activeFlow.id,
                nodeId: id,
                position: { x: params.x, y: params.y },
                version: node.getVersion(),
              })
            }
          }}
          onResizeEnd={(_e, params) => {
            if (!activeFlow?.id || !id || !node)
              return

            // Final local update on resize end
            updateNodeDimensionsLocal({
              flowId: activeFlow.id,
              nodeId: id,
              dimensions: { width: params.width }, // WIDTH ONLY from resize handle
              version: node.getVersion(),
            })

            // Trigger backend sync
            updateNodeDimensions({
              flowId: activeFlow.id,
              nodeId: id,
              dimensions: { width: params.width }, // WIDTH ONLY!
              version: node.getVersion(),
            })

            // Also update position if changed during resize
            if (params.x !== node.metadata.ui?.position?.x
              || params.y !== node.metadata.ui?.position?.y) {
              updateNodePosition({
                flowId: activeFlow.id,
                nodeId: id,
                position: { x: params.x, y: params.y },
                version: node.getVersion(),
              })
            }
          }}
        />

        {nodeExecution?.executionTime !== undefined && (
          <div className="absolute -top-2 -right-2 px-1 py-0.5 text-xs bg-background rounded border shadow-sm">
            {nodeExecution?.executionTime}
            ms
          </div>
        )}
      </Card>
    </>
  )
}

export default memo(ChaingraphNodeComponent)
