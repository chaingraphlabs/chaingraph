// Helpers for converting between live ports and their state representation
import type { PortState } from '@/store/ports/types.ts'
import type { IPort } from '@chaingraph/types/port/base'

export function portToState(port: IPort): PortState {
  return {
    id: port.id!,
    nodeId: port.getConfig().nodeId!,
    config: port.getConfig(),
    value: port.getValue(),
  }
}
