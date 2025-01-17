import type { NodeDropEvent } from '@/components/dnd'
import type {
  DefaultEdgeOptions,
  Edge,
  FitViewOptions,
  Node,
  NodeTypes,
  OnConnect,
  OnEdgesChange,
  OnNodeDrag,
  OnNodesChange,
} from '@xyflow/react'
import type { Connection, Viewport } from '@xyflow/system'
import { useDnd } from '@/components/dnd'
import ChaingraphNode from '@/components/flow/nodes/ChaingraphNode/ChaingraphNode'
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

const fitViewOptions: FitViewOptions = {
  minZoom: 0.1,
  maxZoom: 4,
  padding: 0.2,
}

function Flow() {
  // Refs and hooks
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()
  const { onNodeDrop } = useDnd()
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
        x: event.position.x, // - reactFlowBounds.left,
        y: event.position.y, // - reactFlowBounds.top,
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

  return (
    <div className="h-full w-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        nodeTypes={nodeTypes}
        edges={edges}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={onReconnect}
        onReconnectStart={onReconnectStart}
        onReconnectEnd={onReconnectEnd}
        onNodeDrag={onNodeDrag}
        fitView
        preventScrolling
        defaultViewport={defaultViewport}
        defaultEdgeOptions={defaultEdgeOptions}
        fitViewOptions={fitViewOptions}
        className="bg-background"
      >
        <Background />
        <Controls position="bottom-right" />
      </ReactFlow>
    </div>
  )
}

export default Flow
