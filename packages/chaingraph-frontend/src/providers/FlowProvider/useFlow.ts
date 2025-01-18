import { useContext } from 'react'
import { FlowContext } from './FlowContext'

/**
 * Hook to access the current flow context
 * Throws if used outside of FlowProvider
 */
export function useFlow() {
  const context = useContext(FlowContext)
  if (!context) {
    throw new Error('useFlow must be used within FlowProvider')
  }
  return context
}
