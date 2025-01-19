import type { PortState } from '@/store'
import type { IPort } from '@chaingraph/types'

// Helpers for converting between live ports and their state representation
export function portToState(port: IPort<any>): PortState {
  return {
    id: port.config.id!,
    nodeId: port.config.nodeId!,
    config: port.config,
    value: port.getValue(),
  }
}
