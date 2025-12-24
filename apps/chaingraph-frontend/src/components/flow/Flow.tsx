/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategoryMetadata, NodeMetadata } from '@badaitech/chaingraph-types'
import type {
  DefaultEdgeOptions,
  FinalConnectionState,
  OnConnectStartParams,
} from '@xyflow/react'
import type { Viewport } from '@xyflow/system'
import { NodeRegistry } from '@badaitech/chaingraph-types'
import { Background, ReactFlow, useNodesInitialized, useReactFlow } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { AnimatePresence } from 'framer-motion'
import { memo, use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NodeContextMenu } from '@/components/flow/components/context-menu/NodeContextMenu'
import { FlowControlPanel } from '@/components/flow/components/control-panel/FlowControlPanel'
import { StyledControls } from '@/components/flow/components/controls/StyledControls'
import { FlowEmptyState } from '@/components/flow/components/FlowEmptyState'
import { SubscriptionStatus } from '@/components/flow/components/SubscriptionStatus'
import { edgeTypes } from '@/components/flow/edges'
import { useEdgeAnchorKeyboard } from '@/components/flow/hooks/useEdgeAnchorKeyboard'
import { useEdgeKeyboardShortcuts } from '@/components/flow/hooks/useEdgeKeyboardShortcuts'
import { useFlowCallbacks } from '@/components/flow/hooks/useFlowCallbacks'
import { useFlowCopyPaste } from '@/components/flow/hooks/useFlowCopyPaste'
import { useNodeDrop } from '@/components/flow/hooks/useNodeDrop'
import { NodeInternalsSync } from '@/components/flow/NodeInternalsSync'
import ChaingraphNodeOptimized from '@/components/flow/nodes/ChaingraphNode/ChaingraphNodeOptimized'
import GroupNode from '@/components/flow/nodes/GroupNode/GroupNode'
import { cn } from '@/lib/utils'
import { ZoomContext } from '@/providers/ZoomProvider'
import { $isDraggingAnchor, deselectAnchor } from '@/store/edges/anchor-selection'
import { useXYFlowEdges } from '@/store/edges/hooks/useXYFlowEdges'
import { deselectEdge, selectEdge } from '@/store/edges/selection'
import { $isConnectingBeginEvent, $isConnectingEndEvent } from '@/store/edges/stores'
import { $executionState, $executionSubscriptionState, ExecutionSubscriptionStatus } from '@/store/execution'

import { $activeFlowId, $flowSubscriptionState, setActiveFlowId } from '@/store/flow'
import { addNodeToFlow } from '@/store/nodes'
import { useXYFlowNodes } from '@/store/nodes/hooks/useXYFlowNodes'
import { FPSCounter } from './components/FPSCounter'

// Configuration constants
const defaultViewport: Viewport = {
  x: 0,
  y: 0,
  zoom: 0.2,
}

const defaultEdgeOptions: DefaultEdgeOptions = {
  animated: true,
}

function ExecutionComponent() {
  const { status: executionStatus } = useUnit($executionState)
  const { status: subscriptionStatus, error } = useUnit($executionSubscriptionState)

  const isSubscribed = subscriptionStatus === ExecutionSubscriptionStatus.SUBSCRIBED
  const isConnecting = subscriptionStatus === ExecutionSubscriptionStatus.CONNECTING

  return (
    <div>
      <p>
        Execution Status:
        {executionStatus}
      </p>
      <p>
        Subscription Status:
        {subscriptionStatus}
      </p>
      {isSubscribed && <p>Subscription is active</p>}
      {isConnecting && <p>Connecting...</p>}
      {error && (
        <p>
          Error:
          {error.message}
        </p>
      )}
    </div>
  )
}

export interface FlowProps {
  className?: string

  flowId?: string
}

function Flow({
  className,
  flowId,
}: FlowProps) {
  // useFlowDebug()

  // Subscriptions are now managed automatically by Effector stores
  // No need for subscription hooks here!

  // Refs and hooks
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition, getZoom, getViewport } = useReactFlow()
  const { setZoom } = use(ZoomContext)

  // State
  const nodes = useXYFlowNodes()
  const edges = useXYFlowEdges()
  const activeFlowId = useUnit($activeFlowId)
  const subscriptionState = useUnit($flowSubscriptionState)

  const nodeTypes = useMemo(() => ({
    chaingraphNode: ChaingraphNodeOptimized,
    groupNode: memo(GroupNode),
  }), [])

  // Setup node drop handling
  useNodeDrop()

  // Setup copy-paste functionality
  const copyPasteHook = useFlowCopyPaste()

  // Setup anchor keyboard shortcuts
  useEdgeAnchorKeyboard()

  // Setup edge keyboard shortcuts (delete edge with backspace)
  useEdgeKeyboardShortcuts()

  // Get interaction callbacks
  const {
    onNodesChange,
    onEdgesChange,
    onConnect,
    onReconnect,
    onReconnectStart,
    onReconnectEnd,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
  } = useFlowCallbacks()

  const nodesInitialized = useNodesInitialized({
    includeHiddenNodes: false,
  })

  useEffect(() => {
    if (nodesInitialized) {
      // console.log('[Flow] Nodes initialized:', nodesInitialized)
      // setLayoutedNodes(yourLayoutingFunction(getNodes()));
    }
  }, [nodesInitialized])

  // State for a context menu
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null)

  // Handle node clicks - deselect any selected edge
  const handleNodeClick = useCallback(() => {
    deselectEdge()
  }, [])

  // const onInit = useCallback(() => {
  //   setZoom(getZoom())
  // }, [getZoom, setZoom])

  // Handle context menu
  const onContextMenu = useCallback((event: React.MouseEvent) => {
    if (!activeFlowId) {
      return
    }
    // Prevent default context menu
    event.preventDefault()

    // Get position
    const position = {
      x: event.clientX,
      y: event.clientY,
    }

    setContextMenu(position)
  }, [activeFlowId])

  // Handle node selection
  const handleNodeSelect = useCallback((nodeMeta: NodeMetadata, categoryMetadata: CategoryMetadata) => {
    if (!contextMenu || !activeFlowId)
      return

    const flowPosition = screenToFlowPosition({
      x: contextMenu.x,
      y: contextMenu.y,
    })

    const node = NodeRegistry.getInstance().createNode(nodeMeta.type, 'new')

    // Dispatch addNodeToFlow event
    addNodeToFlow({
      flowId: activeFlowId,
      nodeType: nodeMeta.type,
      position: flowPosition,
      metadata: {
        title: node.metadata.title,
        description: node.metadata.description,
        category: node.metadata.category,
        tags: node.metadata.tags,
      },
    })

    setContextMenu(null) // Close menu
  }, [activeFlowId, contextMenu, screenToFlowPosition])

  // Update zoom when viewport changes
  const onViewportChange = useCallback((newViewport: Viewport) => {
    const currentZoom = getZoom()
    setZoom(currentZoom)
  }, [getZoom, setZoom])

  // Handle edge selection
  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: any) => {
    event.stopPropagation()
    selectEdge(edge.id)
  }, [])

  // Check if anchor is being dragged
  const isDraggingAnchor = useUnit($isDraggingAnchor)

  // Handle pane click to deselect (but not during anchor drag)
  const handlePaneClick = useCallback(() => {
    // Don't deselect during anchor drag - user may release mouse outside edge path
    if (isDraggingAnchor) return
    deselectEdge()
    deselectAnchor()
  }, [isDraggingAnchor])

  // Check flowId props and set active flow if changed
  useEffect(() => {
    if (!flowId || activeFlowId === flowId)
      return

    setActiveFlowId(flowId)
  }, [flowId, activeFlowId])

  // const nodesInside = useStore(useCallback(selector, []), shallow)

  return (
    <div
      className={cn(
        'w-full h-full relative chaingraph-root',
        className,
      )}
      ref={reactFlowWrapper}
      onContextMenu={onContextMenu}
    >
      <div className="absolute top-4 right-4 z-50">
        <SubscriptionStatus
          status={subscriptionState.status}
          className="shadow-lg"
        />
      </div>

      <ReactFlow
        nodes={nodes}
        nodeTypes={nodeTypes}
        edges={edges}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeClick={handleNodeClick}

        onlyRenderVisibleElements={true}
        // onEdgesChange={onEdgesChange}
        // onInit={onInit}
        onConnect={onConnect}
        onConnectStart={(event: MouseEvent | TouchEvent, params: OnConnectStartParams) => {
          // TODO: probably add an event data to indicate the connection start
          $isConnectingBeginEvent({
            nodeId: params.nodeId,
            handleId: params.handleId,
            handleType: params.handleType,
          })
        }}
        onConnectEnd={(event: MouseEvent | TouchEvent, connectionState: FinalConnectionState) => {
          // TODO: probably add an event data to indicate the connection end
          $isConnectingEndEvent(connectionState)
        }}
        onEdgesChange={onEdgesChange}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        onReconnect={onReconnect}
        onReconnectStart={onReconnectStart}
        onReconnectEnd={onReconnectEnd}
        // onReconnect={onReconnect}
        // onReconnectStart={onReconnectStart}
        // onReconnectEnd={onReconnectEnd}
        onNodeDrag={onNodeDrag}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        panOnScroll={true}
        zoomOnDoubleClick={true}
        connectOnClick={true}
        deleteKeyCode={['Delete', 'Backspace']}
        onViewportChange={onViewportChange}
        fitView={true}
        preventScrolling
        defaultViewport={defaultViewport}
        defaultEdgeOptions={defaultEdgeOptions}
        className="bg-background"
        minZoom={0.05}
        maxZoom={2}
        nodeDragThreshold={1}
      >
        <Background />
        <NodeInternalsSync />
        {/* <Controls position="bottom-right" /> */}
        <StyledControls position="bottom-right" />

        {activeFlowId && (
          <FlowControlPanel />
        )}

        <div className="absolute top-4 left-4 z-50">
          {/* <ExecutionComponent /> */}
          {/* <FPSCounter /> */}
        </div>
      </ReactFlow>

      {/* Context Menu */}
      <AnimatePresence>
        {(activeFlowId && contextMenu) && (
          <NodeContextMenu
            position={contextMenu}
            onSelect={handleNodeSelect}
            onClose={() => setContextMenu(null)}
          />
        )}
      </AnimatePresence>

      {/* Show empty state when no flow is selected */}
      {!activeFlowId && <FlowEmptyState />}
    </div>
  )
}

export default Flow
