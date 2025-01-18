import type { Flow, FlowMetadata } from '@chaingraph/types'
import { createContext } from 'react'

export interface FlowContextType {
  // Current active flow instance
  flow: Flow | null
  // Flow metadata (for backwards compatibility)
  selectedFlow?: FlowMetadata
  // Loading states
  isLoading: boolean
  // Error state
  error: Error | null
  // Set selected flow by ID - this will fetch and initialize the flow
  setSelectedFlow: (flow: FlowMetadata | null) => void
}

export const FlowContext = createContext<FlowContextType | undefined>(undefined)
