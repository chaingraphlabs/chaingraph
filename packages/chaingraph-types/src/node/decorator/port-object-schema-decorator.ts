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
  category?: string
  description?: string
  portsConfig?: Map<string, PortConfig>
  isObjectSchema?: boolean
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

    metadata.category = '__OBJECT_SCHEMA__'

    NodeRegistry.getInstance().registerObjectSchema(metadata.id as string, {
      id: metadata.id as string,
      type: metadata.type,
      category: metadata.category,
      description: metadata.description,
      properties: Object.fromEntries(metadata.portsConfig),
      isObjectSchema: true,
    })

    // nodeMetadata.id = metadata.id
    nodeMetadata.type = metadata?.type ?? target.name
    nodeMetadata.description = metadata.description
    nodeMetadata.category = metadata.category as any

    // update the metadata
    NodeRegistry.getInstance().updateNode(target, nodeMetadata)
  }
}
