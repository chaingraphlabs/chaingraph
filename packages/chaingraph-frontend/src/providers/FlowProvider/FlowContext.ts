import type { FlowMetadata } from '@chaingraph/types'
import { createContext } from 'react'

export interface FlowContextType {
  selectedFlow?: FlowMetadata
  setSelectedFlow: (flow: FlowMetadata | null) => void
  isLoading: boolean
}

export const FlowContext = createContext<FlowContextType | undefined>(undefined)
