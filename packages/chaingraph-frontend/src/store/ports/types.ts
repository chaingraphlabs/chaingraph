import type { PortConfig, PortValue } from '@chaingraph/types'

export interface PortState {
  id: string
  nodeId: string
  config: PortConfig
  value: PortValue
  parentPortId?: string // For nested ports
}

export interface PortsStore {
  ports: Record<string, PortState>
  isLoading: boolean
  error: Error | null
}
