import type { IEdge, INode } from '@chaingraph/types'
import type { FlowEventHandlerMap } from '@chaingraph/types/flow/eventHandlers.ts'
import type { FlowContextType } from './FlowContext'
import { trpc } from '@/api/trpc/client'
import { useSelectedFlow } from '@/components/sidebar/tabs/flow/hooks/useSelectedFlow'
import { Flow } from '@chaingraph/types'
import { createEventHandler } from '@chaingraph/types/flow/eventHandlers.ts'
import { FlowEventType } from '@chaingraph/types/flow/events.ts'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FlowContext } from './FlowContext'

/**
 * Provider component that manages the current active flow state
 * and provides methods to interact with it
 */
export function FlowProvider({ children }: React.PropsWithChildren) {
  // Use existing flow selection logic
  const { selectedFlow, setSelectedFlow, isLoading: isLoadingFlow } = useSelectedFlow()

  // State for flow instance
  const [flow, setFlow] = useState<Flow | null>(null)
  const [error, setError] = useState<Error | null>(null)

  // Refs for maintaining flow state
  const nodesRef = useRef(new Map<string, INode>())
  const edgesRef = useRef(new Map<string, IEdge>())
  const isInitializedRef = useRef(false)

  // Initialize flow with current data
  const initializeFlow = useCallback(() => {
    if (!selectedFlow || isInitializedRef.current)
      return

    // Create new flow instance
    try {
      const newFlow = new Flow(selectedFlow)

      // Add all nodes
      for (const node of nodesRef.current.values()) {
        newFlow.addNode(node)
      }

      // Add all edges
      for (const edge of edgesRef.current.values()) {
        newFlow.addEdge(edge)
      }

      console.log('Flow initialized:', newFlow)
      setFlow(newFlow)
      isInitializedRef.current = true
    } catch (err) {
      console.error('Failed to initialize flow:', err)
      setError(err as Error)
    }
  }, [selectedFlow])

  // Define event handlers
  const eventHandlers: FlowEventHandlerMap = useMemo(() => ({
    [FlowEventType.NodeAdded]: (data) => {
      const { node } = data
      nodesRef.current.set(node.id, node)
      flow?.addNode(node)
    },

    [FlowEventType.NodeRemoved]: (data) => {
      const { nodeId } = data
      nodesRef.current.delete(nodeId)
      flow?.removeNode(nodeId)
    },

    [FlowEventType.EdgeAdded]: (data) => {
      const { edge } = data
      edgesRef.current.set(edge.id, edge)
      flow?.addEdge(edge)
    },

    [FlowEventType.EdgeRemoved]: (data) => {
      const { edgeId } = data
      edgesRef.current.delete(edgeId)
      flow?.removeEdge(edgeId)
    },

    // MetadataUpdated is handled by useSelectedFlow
    [FlowEventType.MetadataUpdated]: () => {
      // No-op - handled elsewhere
    },

    // Add other handlers as needed...
  }), [flow])

  // Create event handler with error handling
  const handleEvent = useMemo(() => createEventHandler(eventHandlers, {
    onError: (error, event) => {
      console.error(`Error handling event ${event.type}:`, error)
      setError(error)
    },
  }), [eventHandlers])

  // Subscribe to flow events
  const result = trpc.flow.subscribeToEvents.useSubscription(
    {
      flowId: selectedFlow?.id ?? '',
      lastEventId: null,
    },
    {
      // enabled: Boolean(selectedFlow?.id),
      onData: async (trackedData) => {
        console.log('Received event:', trackedData.data)

        // Handle the event
        await handleEvent(trackedData.data)

        // Try to initialize flow if needed
        initializeFlow()
      },
      onError: (error) => {
        console.error('Error subscribing to flow events:', error)
        setError(new Error(error.message))
      },
    },
  )

  // Reset state when selected flow changes
  useEffect(() => {
    if (selectedFlow?.id) {
      nodesRef.current.clear()
      edgesRef.current.clear()
      isInitializedRef.current = false
      setFlow(null)
      setError(null)
    }
  }, [selectedFlow?.id])

  // Create context value
  const contextValue: FlowContextType = useMemo(() => ({
    flow,
    selectedFlow,
    isLoading: isLoadingFlow || result.status === 'connecting',
    error,
    setSelectedFlow,
  }), [
    flow,
    selectedFlow,
    isLoadingFlow,
    result.status,
    error,
    setSelectedFlow,
  ])

  return (
    <FlowContext.Provider value={contextValue}>
      {children}
    </FlowContext.Provider>
  )
}
