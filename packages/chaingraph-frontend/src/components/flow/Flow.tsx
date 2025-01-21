import type { CategoryMetadata, NodeMetadata } from '@chaingraph/types'
import type {
  DefaultEdgeOptions,
  NodeTypes,
} from '@xyflow/react'
import type { Viewport } from '@xyflow/system'
import { useDnd } from '@/components/dnd'
import { NodeContextMenu } from '@/components/flow/context-menu/NodeContextMenu.tsx'
import { useFlowCallbacks } from '@/components/flow/hooks/useFlowCallbacks.ts'
import { useFlowEdges } from '@/components/flow/hooks/useFlowEdges.ts'
import { useFlowNodes } from '@/components/flow/hooks/useFlowNodes.ts'
import { useNodeDrop } from '@/components/flow/hooks/useNodeDrop.ts'
import ChaingraphNode from '@/components/flow/nodes/ChaingraphNode/ChaingraphNode'
import { ZoomContext } from '@/providers/ZoomProvider'
import { $activeFlowMetadata, addNodeToFlow, useFlowSubscription } from '@/store'
import { nodeRegistry } from '@chaingraph/nodes'
import {
  Background,
  Controls,
  ReactFlow,
  useReactFlow,
} from '@xyflow/react'
import { useUnit } from 'effector-react'
import { AnimatePresence } from 'framer-motion'
import { useCallback, useContext, useRef, useState } from 'react'
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

const nodeTypes: NodeTypes = {
  chaingraphNode: ChaingraphNode,
  // chaingraphNodeTest: ChaingraphCustomNode,
}

function Flow() {
  // useFlowDebug()
  useFlowSubscription()

  // Refs and hooks
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition, getZoom } = useReactFlow()
  const { onNodeDrop } = useDnd()
  const { setZoom } = useContext(ZoomContext)
  const edgeReconnectSuccessful = useRef(true)

  // State
  // const [nodes, setNodes] = useState<Node[]>(initialNodes)
  // const [edges, setEdges] = useState<Edge[]>(initialEdges)
  const nodes = useFlowNodes()
  const edges = useFlowEdges()
  const activeFlow = useUnit($activeFlowMetadata)

  // const edges = useFlowEdges()

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
  } = useFlowCallbacks()

  // Register node types

  // const edgeTypes = useMemo(() => ({
  //   chaingraphEdge: ChaingraphEdge,
  // }), [])

  // Update zoom when viewport changes
  const onViewportChange = useCallback(() => {
    const currentZoom = getZoom()
    setZoom(currentZoom)
  }, [getZoom, setZoom])

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
  const handleNodeSelect = useCallback((nodeMeta: NodeMetadata, categoryMetadata: CategoryMetadata) => {
    if (!contextMenu || !activeFlow)
      return

    const flowPosition = screenToFlowPosition({
      x: contextMenu.x,
      y: contextMenu.y,
    })

    const node = nodeRegistry.createNode(nodeMeta.type, 'new')

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
        // edgeTypes={edgeTypes}
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
