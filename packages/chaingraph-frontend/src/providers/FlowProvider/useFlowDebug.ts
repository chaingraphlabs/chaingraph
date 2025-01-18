import { useFlow } from '@/providers/FlowProvider/useFlow.ts'
import { useEffect } from 'react'

/**
 * Debug hook to log flow state changes
 */
export function useFlowDebug() {
  const { flow, selectedFlow, isLoading, error } = useFlow()

  useEffect(() => {
    console.group('Flow Debug')
    console.log('Selected Flow:', selectedFlow)
    console.log('Flow Instance:', flow)
    console.log('Is Loading:', isLoading)
    console.log('Error:', error)
    if (flow) {
      console.log('Nodes:', Array.from(flow.nodes.values()))
      console.log('Edges:', Array.from(flow.edges.values()))
    }
    console.groupEnd()
  }, [flow, selectedFlow, isLoading, error])
}
