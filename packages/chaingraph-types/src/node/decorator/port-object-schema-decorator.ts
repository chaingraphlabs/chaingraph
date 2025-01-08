import type {
  PortConfig,
} from '@chaingraph/types'
import {
  getOrCreateNodeMetadata,
  NodeRegistry,
} from '@chaingraph/types'
import { v7 as uuidv7 } from 'uuid'

export function PortObjectSchema() {
  return function (target: any) {
    const metadata = getOrCreateNodeMetadata(target.prototype)

    if (!metadata.portsConfig) {
      metadata.portsConfig = new Map<string, PortConfig>()
    }

    if (!metadata.id) {
      metadata.id = uuidv7() // Generate a unique ID for the object schema
    }

    if (!metadata.type) {
      metadata.type = target.name
    }

    // if (config !== undefined) {
    //   metadata.objectPortConfig = config
    // }

    NodeRegistry.getInstance().registerObjectSchema(metadata.id as string, {
      id: metadata.id as string,
      type: metadata.type,
      properties: Object.fromEntries(metadata.portsConfig),
    })
  }
}
