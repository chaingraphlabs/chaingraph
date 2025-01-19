import type { INode, IPort } from '@chaingraph/types'
import { combine } from 'effector'
import { $nodes } from './nodes'
import { $ports } from './ports'

// Export all stores
export { $flow } from './flow'
// Export all events
export * from './flow/events'
// Export all types
export * from './flow/types'

export { $nodes } from './nodes'
export * from './nodes/events'
export * from './nodes/types'

export { $ports } from './ports'
export * from './ports/events'
export * from './ports/types'

// Create combined selectors
export const $nodeWithPorts = combine(
  $nodes,
  $ports,
  (nodesStore, portsStore) => (nodeId: string) => {
    const node = nodesStore.nodes[nodeId]
    if (!node)
      return null

    const nodePorts = node.portIds
      .map(portId => portsStore.ports[portId])
      .filter(Boolean)

    return {
      ...node,
      ports: nodePorts,
    }
  },
)

// Helper to reconstruct live objects
export function reconstructNode(nodeData: INode, ports: IPort<any>[]): INode {
  // Your existing reconstruction logic here
  // This would create a new instance of your node class with all its methods
  return nodeData
}
