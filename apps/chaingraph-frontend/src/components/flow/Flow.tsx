/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategoryMetadata, NodeMetadata } from '@badaitech/chaingraph-types'
import type { DefaultEdgeOptions } from '@xyflow/react'
import type { Viewport } from '@xyflow/system'
import { NodeContextMenu } from '@/components/flow/components/context-menu/NodeContextMenu'
import { FlowControlPanel } from '@/components/flow/components/control-panel/FlowControlPanel'
import { StyledControls } from '@/components/flow/components/controls/StyledControls'
import { FlowEmptyState } from '@/components/flow/components/FlowEmptyState'
import { SubscriptionStatus } from '@/components/flow/components/SubscriptionStatus'
import { edgeTypes } from '@/components/flow/edges'
import { useFlowCallbacks } from '@/components/flow/hooks/useFlowCallbacks'
import { useNodeDrop } from '@/components/flow/hooks/useNodeDrop'
import ChaingraphNodeOptimized from '@/components/flow/nodes/ChaingraphNode/ChaingraphNodeOptimized'
import GroupNode from '@/components/flow/nodes/GroupNode/GroupNode'
import { cn } from '@/lib/utils'
import { ZoomContext } from '@/providers/ZoomProvider'
import {
  $activeFlowMetadata,
  $flowSubscriptionState,
  addNodeToFlow,
  useFlowSubscription,
} from '@/store'
import { useXYFlowEdges } from '@/store/edges/hooks/useXYFlowEdges'
import { $executionState, useExecutionSubscription } from '@/store/execution'
import { useXYFlowNodes } from '@/store/nodes/hooks/useXYFlowNodes'
import { NodeRegistry } from '@badaitech/chaingraph-types'
import { Background, ReactFlow, useReactFlow } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { AnimatePresence } from 'framer-motion'
import { memo, use, useCallback, useMemo, useRef, useState } from 'react'
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
  const { isSubscribed, isConnecting, status: subscriptionStatus, error } = useExecutionSubscription()

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
}

function Flow({
  className,
}: FlowProps) {
  // useFlowDebug()

  useFlowSubscription()
  useExecutionSubscription()
  // useFlowUrlSync()

  // Refs and hooks
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition, getZoom } = useReactFlow()
  // const { onNodeDrop } = useDnd()
  const { setZoom } = use(ZoomContext)
  // const edgeReconnectSuccessful = useRef(true)

  // State
  const nodes = useXYFlowNodes()
  const edges = useXYFlowEdges()
  const activeFlow = useUnit($activeFlowMetadata)
  const subscriptionState = useUnit($flowSubscriptionState)

  const nodeTypes = useMemo(() => ({
    // chaingraphNode: memo(ChaingraphNode),
    chaingraphNode: ChaingraphNodeOptimized,
    groupNode: memo(GroupNode),
  }), [])

  // Setup node drop handling
  useNodeDrop()

  // Get interaction callbacks
  const {
    onNodesChange,
    onEdgesChange,
    onConnect,
    onReconnect,
    onReconnectStart,
    onReconnectEnd,
    onNodeDragStop,
  } = useFlowCallbacks()

  // Register node types

  // const edgeTypes = useMemo(() => ({
  //   chaingraphEdge: ChaingraphEdge,
  // }), [])

  // State for context menu
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null)

  // // Subscribe to node drop events
  // useEffect(() => {
  //   // Handler for node drops
  //   const handleNodeDrop = (event: NodeDropEvent) => {
  //     if (!reactFlowWrapper.current)
  //       return
  //
  //     // Calculate position relative to the ReactFlow container
  //     const position = screenToFlowPosition({
  //       x: event.position.x,
  //       y: event.position.y,
  //     })
  //
  //     // Create new node
  //     const newNode = {
  //       id: uuidv7(),
  //       type: 'chaingraphNode',
  //       position,
  //       data: {
  //         node: event.node,
  //         categoryMetadata: event.categoryMetadata,
  //       },
  //     }
  //
  //     // setNodes(nodes => [...nodes, newNode])
  //   }
  //
  //   // Subscribe to drop events
  //   const unsubscribe = onNodeDrop(handleNodeDrop)
  //
  //   // Cleanup subscription
  //   return unsubscribe
  // }, [onNodeDrop, screenToFlowPosition])

  const onInit = useCallback(() => {
    setZoom(getZoom())
  }, [getZoom, setZoom])

  // Node changes handler
  // const onNodesChange: OnNodesChange = useCallback(
  //   changes => setNodes(nds => applyNodeChanges(changes, nds)),
  //   [],
  // )

  // Edge changes handler
  // const onEdgesChange: OnEdgesChange = useCallback(
  //   changes => setEdges(eds => applyEdgeChanges(changes, eds)),
  //   [],
  // )

  // Connection handlers
  // const onConnect: OnConnect = useCallback(
  //   connection => setEdges(eds => addEdge(connection, eds)),
  //   [],
  // )

  // const onReconnectStart = useCallback(() => {
  //   edgeReconnectSuccessful.current = false
  // }, [])
  //
  // const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
  //   edgeReconnectSuccessful.current = true
  //   setEdges(els => reconnectEdge(oldEdge, newConnection, els))
  // }, [])
  //
  // const onReconnectEnd = useCallback((_: MouseEvent | TouchEvent, edge: Edge) => {
  //   if (!edgeReconnectSuccessful.current) {
  //     setEdges(eds => eds.filter(e => e.id !== edge.id))
  //   }
  //   edgeReconnectSuccessful.current = true
  // }, [])

  // Node drag handler
  // const onNodeDrag: OnNodeDrag = useCallback((_, node) => {
  //   updateNodeUI({
  //     nodeId: node.id,
  //     ui: {
  //       position: node.position,
  //     },
  //   })
  // }, [])

  // Handle context menu
  const onContextMenu = useCallback((event: React.MouseEvent) => {
    if (!activeFlow) {
      return
    }
    // Prevent default context menu
    event.preventDefault()

    // Get position
    const position = {
      x: event.clientX,
      y: event.clientY,
    }

    console.log('Context menu opening at:', position)
    setContextMenu(position)
  }, [activeFlow])

  // Handle node selection
  const handleNodeSelect = useCallback((nodeMeta: NodeMetadata, categoryMetadata: CategoryMetadata) => {
    if (!contextMenu || !activeFlow)
      return

    const flowPosition = screenToFlowPosition({
      x: contextMenu.x,
      y: contextMenu.y,
    })

    const node = NodeRegistry.getInstance().createNode(nodeMeta.type, 'new')

    console.log('SEND ONE ADD NODE TO FLOW')

    // Dispatch addNodeToFlow event
    addNodeToFlow({
      flowId: activeFlow.id!,
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
  }, [activeFlow, contextMenu, screenToFlowPosition])

  // Update zoom when viewport changes
  const onViewportChange = useCallback((newViewport: Viewport) => {
    const currentZoom = getZoom()
    setZoom(currentZoom)
  }, [getZoom, setZoom])

  // const onChange = useCallback(({ nodes, edges }) => {
  //   setSelectedNodes(nodes.map(node => node.id))
  //   setSelectedEdges(edges.map(edge => edge.id))
  //
  //   // nodes.forEach((node) => {
  //   //   console.log('Node:', node)
  //   // })
  // }, [])
  //
  // useOnSelectionChange({
  //   onChange,
  // })

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
        // onEdgesChange={onEdgesChange}
        onInit={onInit}
        onConnect={onConnect}
        onEdgesChange={onEdgesChange}
        onReconnect={onReconnect}
        onReconnectStart={onReconnectStart}
        onReconnectEnd={onReconnectEnd}
        // onReconnect={onReconnect}
        // onReconnectStart={onReconnectStart}
        // onReconnectEnd={onReconnectEnd}
        // onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        panOnScroll
        onViewportChange={onViewportChange}
        fitView
        preventScrolling
        defaultViewport={defaultViewport}
        defaultEdgeOptions={defaultEdgeOptions}
        className="bg-background"
        minZoom={0.2}
        maxZoom={2}
        nodeDragThreshold={5}

        // Add these important properties for performance:
        nodesFocusable={false}
        edgesFocusable={false}
        // This is crucial - tells React Flow to use shallow comparison
        // when checking if nodes have changed
        nodeExtent={[
          [-10000, -10000],
          [10000, 10000],
        ]}
      >
        <Background />
        {/* <Controls position="bottom-right" /> */}
        <StyledControls position="bottom-right" />

        {activeFlow && (
          <FlowControlPanel />
        )}

        <div className="absolute top-4 left-4 z-50">
          {/* <ExecutionComponent /> */}

          <FPSCounter />
        </div>
      </ReactFlow>

      {/* Context Menu */}
      <AnimatePresence>
        {(activeFlow && contextMenu) && (
          <NodeContextMenu
            position={contextMenu}
            onSelect={handleNodeSelect}
            onClose={() => setContextMenu(null)}
          />
        )}
      </AnimatePresence>

      {/* Show empty state when no flow is selected */}
      {!activeFlow && <FlowEmptyState />}
    </div>
  )
}

export default Flow
