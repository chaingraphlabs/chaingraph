import type { NodeDropEvent } from '@/components/dnd'
import type { CategoryMetadata, INode } from '@chaingraph/types'
import type {
  DefaultEdgeOptions,
  Edge,
  Node,
  NodeTypes,
  OnConnect,
  OnEdgesChange,
  OnNodeDrag,
  OnNodesChange,
} from '@xyflow/react'
import type { Connection, Viewport } from '@xyflow/system'
import { useDnd } from '@/components/dnd'
import { NodeContextMenu } from '@/components/flow/context-menu/NodeContextMenu.tsx'
import ChaingraphNode from '@/components/flow/nodes/ChaingraphNode/ChaingraphNode'
import { useFlowDebug } from '@/providers/FlowProvider/useFlowDebug.ts'
import { ZoomContext } from '@/providers/ZoomProvider'
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  ReactFlow,
  reconnectEdge,
  useReactFlow,
} from '@xyflow/react'
import { AnimatePresence } from 'framer-motion'
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { v7 as uuidv7 } from 'uuid'
import { edgeTypes, initialEdges } from './edges'
import { initialNodes } from './nodes'
import { ChaingraphCustomNode } from './nodes/ChaingraphCustomNode'
import NumberNodeComponent from './nodes/NumberNode'
import { PositionLoggerNodeComponent } from './nodes/PositionLoggerNode'
import '@xyflow/react/dist/style.css'

// Configuration constants
const defaultViewport: Viewport = {
  x: 0,
  y: 0,
  zoom: 0.2,
}

const defaultEdgeOptions: DefaultEdgeOptions = {
  animated: true,
}

function Flow() {
  useFlowDebug()

  // Refs and hooks
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition, getZoom } = useReactFlow()
  const { onNodeDrop } = useDnd()
  const { setZoom } = useContext(ZoomContext)
  const edgeReconnectSuccessful = useRef(true)

  // State
  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)

  // Register node types
  const nodeTypes: NodeTypes = useMemo(() => ({
    'position-logger': PositionLoggerNodeComponent,
    'number': NumberNodeComponent,
    'chaingraphNodeTest': ChaingraphCustomNode,
    'chaingraphNode': ChaingraphNode,
  }), [])

  // Update zoom when viewport changes
  const onViewportChange = useCallback(() => {
    const currentZoom = getZoom()
    setZoom(currentZoom)
  }, [getZoom, setZoom])

  // State for context menu
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null)

  // Subscribe to node drop events
  useEffect(() => {
    // Handler for node drops
    const handleNodeDrop = (event: NodeDropEvent) => {
      if (!reactFlowWrapper.current)
        return

      // Get the ReactFlow container bounds
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()

      // Calculate position relative to the ReactFlow container
      const position = screenToFlowPosition({
        x: event.position.x,
        y: event.position.y,
      })

      // Create new node
      const newNode = {
        id: uuidv7(),
        type: 'chaingraphNode',
        position,
        data: {
          node: event.node,
          categoryMetadata: event.categoryMetadata,
        },
      }

      setNodes(nodes => [...nodes, newNode])
    }

    // Subscribe to drop events
    const unsubscribe = onNodeDrop(handleNodeDrop)

    // Cleanup subscription
    return unsubscribe
  }, [onNodeDrop, screenToFlowPosition])

  const onInit = useCallback(() => {
    setZoom(getZoom())
  }, [getZoom, setZoom])

  // Node changes handler
  const onNodesChange: OnNodesChange = useCallback(
    changes => setNodes(nds => applyNodeChanges(changes, nds)),
    [],
  )

  // Edge changes handler
  const onEdgesChange: OnEdgesChange = useCallback(
    changes => setEdges(eds => applyEdgeChanges(changes, eds)),
    [],
  )

  // Connection handlers
  const onConnect: OnConnect = useCallback(
    connection => setEdges(eds => addEdge(connection, eds)),
    [],
  )

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false
  }, [])

  const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
    edgeReconnectSuccessful.current = true
    setEdges(els => reconnectEdge(oldEdge, newConnection, els))
  }, [])

  const onReconnectEnd = useCallback((_: MouseEvent | TouchEvent, edge: Edge) => {
    if (!edgeReconnectSuccessful.current) {
      setEdges(eds => eds.filter(e => e.id !== edge.id))
    }
    edgeReconnectSuccessful.current = true
  }, [])

  // Node drag handler
  const onNodeDrag: OnNodeDrag = useCallback((_, node) => {
    console.log('Node dragged:', node.id)
  }, [])

  // State for context menu position
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number } | null>(null)

  // Handle context menu
  const onContextMenu = useCallback((event: React.MouseEvent) => {
    // Prevent default context menu
    event.preventDefault()

    // Get position
    const position = {
      x: event.clientX,
      y: event.clientY,
    }

    console.log('Context menu opening at:', position)
    setContextMenu(position)
  }, [])

  // Handle node selection
  const handleNodeSelect = useCallback((node: INode, categoryMetadata: CategoryMetadata) => {
    if (!contextMenu)
      return

    const flowPosition = screenToFlowPosition({
      x: contextMenu.x,
      y: contextMenu.y,
    })

    const newNode = {
      id: uuidv7(),
      type: 'chaingraphNode',
      position: flowPosition,
      data: {
        node,
        categoryMetadata,
      },
    }

    setNodes(nodes => [...nodes, newNode])
    setContextMenu(null) // Close menu
  }, [contextMenu, screenToFlowPosition])

  return (
    <div
      className="w-full h-full relative"
      ref={reactFlowWrapper}
      onContextMenu={onContextMenu}
    >
      <ReactFlow
        nodes={nodes}
        nodeTypes={nodeTypes}
        edges={edges}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        onConnect={onConnect}
        onReconnect={onReconnect}
        onReconnectStart={onReconnectStart}
        onReconnectEnd={onReconnectEnd}
        onNodeDrag={onNodeDrag}
        onViewportChange={onViewportChange}
        fitView
        preventScrolling
        defaultViewport={defaultViewport}
        defaultEdgeOptions={defaultEdgeOptions}
        className="bg-background"
        minZoom={0.2}
        maxZoom={2}
      >
        <Background />
        <Controls position="bottom-right" />
      </ReactFlow>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <NodeContextMenu
            position={contextMenu}
            onSelect={handleNodeSelect}
            onClose={() => setContextMenu(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Flow
