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
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  ReactFlow,
  reconnectEdge,
} from '@xyflow/react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { edgeTypes, initialEdges } from './edges'
import { initialNodes } from './nodes'
import { ChaingraphCustomNode } from './nodes/ChaingraphCustomNode'
import NumberNodeComponent from './nodes/NumberNode.tsx'
import { PositionLoggerNodeComponent } from './nodes/PositionLoggerNode.tsx'
import '@xyflow/react/dist/style.css'

const fitViewOptions: FitViewOptions = {
  minZoom: 0.1,
  maxZoom: 4,
  padding: 0.2,
}

const defaultViewport: Viewport = {
  x: 0,
  y: 0,
  zoom: 0.2,
}

const defaultEdgeOptions: DefaultEdgeOptions = {
  animated: true,
}

const onNodeDrag: OnNodeDrag = (_, node) => {
  console.log('drag event', node.data)
}

function Flow() {
  const nodeTypes: NodeTypes = useMemo(() => ({
    'position-logger': PositionLoggerNodeComponent,
    'number': NumberNodeComponent,
    'chaingraphNode': ChaingraphCustomNode,
    // Add any of your custom nodes here!
  }), [])

  const edgeReconnectSuccessful = useRef(true)
  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)

  const onNodesChange: OnNodesChange = useCallback(
    changes => setNodes(nds => applyNodeChanges(changes, nds)),
    [setNodes],
  )
  const onEdgesChange: OnEdgesChange = useCallback(
    changes => setEdges(eds => applyEdgeChanges(changes, eds)),
    [setEdges],
  )
  const onConnect: OnConnect = useCallback(
    connection => setEdges(eds => addEdge(connection, eds)),
    [setEdges],
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

  return (
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
      // viewport={}
      preventScrolling
      // fitViewOptions={fitViewOptions}
      defaultViewport={defaultViewport}
      defaultEdgeOptions={defaultEdgeOptions}

    >
      <Background />
      <Controls position="bottom-right" />
    </ReactFlow>
  )
}

export default Flow
