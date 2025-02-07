import type { IPortConfig, IPortValue } from '@badaitech/chaingraph-types/port/base'

export interface PortState {
  id: string
  nodeId: string
  config: IPortConfig
  value: IPortValue
  parentPortId?: string // For nested ports
}

export interface PortsStore {
  ports: Record<string, PortState>
  isLoading: boolean
  error: Error | null
}
