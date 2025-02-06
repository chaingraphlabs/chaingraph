import type { NodeMetadata } from '@chaingraph/types/node/types'
// NodeConfig — тип конфигурации ноды (например, тип, title, category, description)
import 'reflect-metadata'

/**
 * Retrieves node metadata from the target using new decorators.
 * It reads the node config stored under 'chaingraph:node-config' and merges port configurations
 * (stored under 'chaingraph:ports-config') into the metadata.
 */
export function getOrCreateNodeMetadata(target: any): NodeMetadata {
  // Try to read node configuration metadata from class constructor.
  let nodeMeta: Partial<NodeMetadata> = Reflect.getMetadata('chaingraph:node-config', target.constructor)
  if (!nodeMeta) {
    // If no node config exists, use an empty object with a default type value
    nodeMeta = { type: 'undefined' }
  }

  // Retrieve ports configuration (a Map) from the constructor.
  const portsConfig: Record<string | symbol, any> = Reflect.getMetadata('chaingraph:ports-config', target.constructor) || new Map()

  // Ensure that the returned metadata has a portsConfig property.
  return {
    ...nodeMeta,
    portsConfig,
  } as NodeMetadata
}
