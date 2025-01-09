import type {
  PortConfig,
} from '@chaingraph/types'
import {
  getOrCreateNodeMetadata,
  NodeRegistry,
} from '@chaingraph/types'
import { v7 as uuidv7 } from 'uuid'

export interface ObjectSchemaMetadata {
  id?: string
  type?: string
  description?: string
  portsConfig?: Map<string, PortConfig>
}

export function PortObjectSchema(config?: ObjectSchemaMetadata) {
  return function (target: any) {
    const nodeMetadata = getOrCreateNodeMetadata(target.prototype)
    const metadata: ObjectSchemaMetadata = {
      ...nodeMetadata,
    }

    if (!metadata.portsConfig) {
      metadata.portsConfig = new Map<string, PortConfig>()
    }

    if (!metadata.id) {
      metadata.id = config?.id ?? uuidv7() // Generate a unique ID for the object schema
    }

    if (!metadata.type) {
      metadata.type = target.name // Use the class name as the type
    }

    if (!metadata.description) {
      metadata.description = config?.description ?? ''
    }

    NodeRegistry.getInstance().registerObjectSchema(metadata.id as string, {
      id: metadata.id as string,
      type: metadata.type,
      description: metadata.description,
      properties: Object.fromEntries(metadata.portsConfig),
    })

    nodeMetadata.id = metadata.id
    nodeMetadata.type = metadata?.type ?? target.name
    nodeMetadata.description = metadata.description

    // update the metadata
    NodeRegistry.getInstance().updateNode(target, nodeMetadata)
  }
}
