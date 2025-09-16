/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PortUpdateEvent } from '../node/events'
import type { INode } from '../node/interface'
import type { IPort } from '../port'
import 'reflect-metadata'

const PORT_UPDATE_METADATA_KEY = 'chaingraph:port-update'

/**
 * Handler function type for port update events
 * @template TNode The node type
 * @template TPort The port type
 */
export type PortUpdateHandler<TNode extends INode = INode, TPort extends IPort = IPort>
  = (node: TNode, port: TPort, event: PortUpdateEvent) => Promise<void> | void

/**
 * Interface for configuration of port update handlers
 */
export interface PortUpdateConfig {
  /**
   * Handler function that will be called when the port is updated
   * @param node The node instance
   * @param port The port that was updated
   * @param event The port update event
   */
  handler: PortUpdateHandler<INode, IPort>
}

/**
 * Store the port update handler for a port in metadata
 *
 * @param target The class constructor
 * @param propertyKey The property key
 * @param config The port update configuration
 */
function storePortUpdateHandler(
  target: any,
  propertyKey: string,
  config: PortUpdateConfig,
): void {
  const updateHandlers = Reflect.getMetadata(PORT_UPDATE_METADATA_KEY, target) || {}

  updateHandlers[propertyKey.toString()] = config

  Reflect.defineMetadata(PORT_UPDATE_METADATA_KEY, updateHandlers, target)
}

/**
 * Retrieve port update handlers for a class
 *
 * @param target The class constructor
 * @returns Map of port keys to port update handlers
 */
export function getPortUpdateHandlers(target: any): Record<string, PortUpdateConfig> {
  return Reflect.getMetadata(PORT_UPDATE_METADATA_KEY, target.constructor) || {}
}

/**
 * Apply stored port update handlers for a specific port update event
 *
 * @param node The node instance
 * @param event The port update event
 */
export async function applyPortUpdateHandlers(node: INode, event: PortUpdateEvent): Promise<void> {
  const handlers = getPortUpdateHandlers(node)
  const updatedPort = event.port

  if (!updatedPort) {
    return
  }

  // Find which property this port corresponds to
  const portKey = updatedPort.getConfig().key
  if (!portKey) {
    return
  }

  // Check if there's a handler for this port
  const handlerConfig = handlers[portKey]
  if (!handlerConfig) {
    return
  }

  try {
    // Call the handler - the stored handler accepts base types,
    // but the actual node and port will be the correct subtypes at runtime
    await handlerConfig.handler(node, updatedPort, event)
  } catch (error) {
    console.error(`[OnPortUpdate] Error in port update handler for node '${node.id}' and port '${portKey}':`, error)
    // Don't re-throw to avoid breaking the event flow
  }
}

/**
 * Decorator for defining port update handlers
 *
 * This decorator allows you to specify a handler function that will be called
 * whenever the decorated port is updated. The handler receives the node instance,
 * the updated port, and the port update event.
 *
 * Example usage:
 *
 * ```typescript
 * class MyNode extends BaseNode {
 *   @Passthrough()
 *   @PortObject({
 *     title: 'Output Schema',
 *     schema: { properties: {} },
 *     isSchemaMutable: true,
 *   })
 *   @OnPortUpdate(async (node: INode, port: IPort) => {
 *     const targetPort = node.getOutputs().find(p => p.getConfig().key === 'result')
 *     if (targetPort instanceof ObjectPort) {
 *       node.copyObjectSchemaTo(node, port, targetPort)
 *     }
 *   })
 *   outputSchema: Record<string, any> = {}
 * }
 * ```
 *
 * @param handler The handler function to call when the port is updated
 */
export function OnPortUpdate<TNode extends INode = INode, TPort extends IPort = IPort>(
  handler: PortUpdateHandler<TNode, TPort>,
): PropertyDecorator {
  return (target: object, propertyKey: any) => {
    storePortUpdateHandler(target.constructor, propertyKey, { handler: handler as PortUpdateHandler })
  }
}
