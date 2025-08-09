/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '../node/interface'
import type { IPort } from '../port'
import { AnyPort } from '../port'
import { ObjectPort } from '../port'
import { OnPortUpdate } from './port-update.decorator'
import 'reflect-metadata'

const OBJECT_SCHEMA_COPY_TO_METADATA_KEY = 'chaingraph:object-schema-copy-to'

/**
 * Predicate function type for selecting target ports
 */
export type TargetPortPredicate = (port: IPort) => boolean

/**
 * Configuration options for ObjectSchemaCopyTo decorator
 */
export interface ObjectSchemaCopyToConfig {
  /**
   * Whether to use parent UI settings when copying schema
   * @default true
   */
  useParentUI?: boolean

  /**
   * Whether to copy to all matching ports or just the first one
   * @default false
   */
  copyToAll?: boolean
}

/**
 * Internal metadata storage structure
 */
interface ObjectSchemaCopyToMetadata {
  predicate: TargetPortPredicate
  config: ObjectSchemaCopyToConfig
}

/**
 * Store the object schema copy configuration in metadata
 */
function storeObjectSchemaCopyTo(
  target: any,
  propertyKey: string,
  metadata: ObjectSchemaCopyToMetadata,
): void {
  const handlers = Reflect.getMetadata(OBJECT_SCHEMA_COPY_TO_METADATA_KEY, target) || {}
  handlers[propertyKey.toString()] = metadata
  Reflect.defineMetadata(OBJECT_SCHEMA_COPY_TO_METADATA_KEY, handlers, target)
}

/**
 * Retrieve object schema copy configurations for a class
 */
export function getObjectSchemaCopyToConfigs(target: any): Record<string, ObjectSchemaCopyToMetadata> {
  return Reflect.getMetadata(OBJECT_SCHEMA_COPY_TO_METADATA_KEY, target.constructor) || {}
}

/**
 * Decorator for automatically copying object schema to target ports
 *
 * This decorator simplifies the common pattern of copying an object port's schema
 * to another object port when the source port is updated. It internally uses
 * the @OnPortUpdate decorator to handle port update events.
 *
 * Example usage:
 *
 * ```typescript
 * class MyNode extends BaseNode {
 *   @Passthrough()
 *   @PortObject({
 *     title: 'Schema',
 *     schema: { properties: {} },
 *     isSchemaMutable: true,
 *   })
 *   @ObjectSchemaCopyTo(
 *     (port) => port.getConfig().key === 'output' && !port.getConfig().parentId
 *   )
 *   schema: Record<string, any> = {}
 *
 *   @Output()
 *   @PortObject({
 *     title: 'Output',
 *     schema: { properties: {} },
 *   })
 *   output: Record<string, any> = {}
 * }
 * ```
 *
 * @param predicate Function to identify target port(s) for schema copying
 * @param config Optional configuration for schema copying behavior
 */
export function ObjectSchemaCopyTo(
  predicate: TargetPortPredicate,
  config: ObjectSchemaCopyToConfig = {},
): PropertyDecorator {
  // Set defaults for config
  const finalConfig: ObjectSchemaCopyToConfig = {
    useParentUI: true,
    copyToAll: false,
    ...config,
  }

  return (target: object, propertyKey: any) => {
    // Store the configuration in metadata
    storeObjectSchemaCopyTo(target.constructor, propertyKey, {
      predicate,
      config: finalConfig,
    })

    // Apply the OnPortUpdate decorator with our custom handler
    const updateHandler = async (node: INode, port: IPort): Promise<void> => {
      // Ensure the source port is an ObjectPort
      if (!(port instanceof ObjectPort) && !(port instanceof AnyPort)) {
        console.warn(`[ObjectSchemaCopyTo] Source port '${port.getConfig().key}' is not an ObjectPort or AnyPort`)
        return
      }

      const targetPorts = node.findPorts(predicate)

      if (targetPorts.length === 0) {
        console.warn(`[ObjectSchemaCopyTo] No matching target ports found for predicate`)
        return
      }

      // Copy schema to target port(s)
      const portsToUpdate = finalConfig.copyToAll ? targetPorts : [targetPorts[0]]

      for (const targetPort of portsToUpdate) {
        if (!(targetPort instanceof ObjectPort)) {
          console.warn(`[ObjectSchemaCopyTo] Target port '${targetPort.getConfig().key}' is not an ObjectPort`)
          continue
        }

        try {
          node.copyObjectSchemaTo(node, port, targetPort, finalConfig.useParentUI)
        } catch (error) {
          console.error(`[ObjectSchemaCopyTo] Error copying schema to port '${targetPort.getConfig().key}':`, error)
        }
      }
    }

    // Apply the OnPortUpdate decorator
    OnPortUpdate(updateHandler)(target, propertyKey)
  }
}
