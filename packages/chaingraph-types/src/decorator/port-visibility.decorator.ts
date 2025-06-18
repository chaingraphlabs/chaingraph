/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '../node/interface'
import type { IPort } from '../port'
import { findPort } from '../node/traverse-ports'
import { getPortMetadata } from './metadata-storage'
import 'reflect-metadata'

const PORT_VISIBILITY_METADATA_KEY = 'chaingraph:port-visibility'

/**
 * Interface for configuration of port visibility
 */
export interface PortVisibilityConfig {
  /**
   * A function that determines whether the port should be visible
   * @param instance The node instance
   * @returns true if the port should be visible, false otherwise
   */
  showIf: (instance: INode) => boolean
}

/**
 * Store the visibility rule for a port in metadata
 *
 * @param target The class constructor
 * @param propertyKey The property key
 * @param config The visibility configuration
 */
function storeVisibilityRule(
  target: any,
  propertyKey: string,
  config: PortVisibilityConfig,
): void {
  // Store the visibility rule in the port's metadata
  const currentMeta = getPortMetadata(target, propertyKey)
  const visibilityRules
    = Reflect.getMetadata(PORT_VISIBILITY_METADATA_KEY, target) || {}

  visibilityRules[propertyKey.toString()] = config

  Reflect.defineMetadata(PORT_VISIBILITY_METADATA_KEY, visibilityRules, target)

  // Update the port with UI defaults if not already set
  // updatePortMetadata(target, propertyKey, {
  //   ui: {
  //     ...(currentMeta.ui || {}),
  //   },
  // })
}

/**
 * Retrieve visibility rules for a class
 *
 * @param target The class constructor
 * @returns Map of port keys to visibility rules
 */
export function getVisibilityRules(target: any): Record<string, PortVisibilityConfig> {
  return Reflect.getMetadata(PORT_VISIBILITY_METADATA_KEY, target.constructor) || {}
}

/**
 * Apply stored visibility rules to a node instance
 * Return mutated ports
 *
 * @param node The node instance
 */
export function applyVisibilityRules(node: INode): IPort[] {
  const rules = getVisibilityRules(node)
  const mutatedPorts: IPort[] = []

  for (const [portKey, config] of Object.entries(rules)) {
    const port = findPort(node, port => port.getConfig().key === portKey)

    if (port) {
      const shouldBeVisible = config.showIf(node)
      const portConfig = port.getConfig()
      const isCurrentlyHidden = portConfig.ui?.hidden !== false && portConfig.ui?.hidden !== undefined

      // Only update if the visibility state needs to change
      if (isCurrentlyHidden === shouldBeVisible) {
        port.setConfig({
          ...portConfig,
          ui: {
            ...(portConfig.ui || {}),
            hidden: !shouldBeVisible,
          },
        })
        mutatedPorts.push(port)
      }
    }
  }

  return mutatedPorts
}

/**
 * Decorator for defining conditional visibility rules for ports
 *
 * This decorator allows you to specify a condition function that determines
 * when a port should be visible. The condition is evaluated whenever the node
 * receives an event.
 *
 * Example usage:
 *
 * ```typescript
 * class MyNode extends BaseNode {
 *   @Input()
 *   @PortString({
 *     title: 'Mode',
 *   })
 *   mode: string = 'replace';
 *
 *   @PortVisibility({
 *     showIf: (node) => (node as MyNode).mode === 'replace'
 *   })
 *   @Input()
 *   @PortString({
 *     title: 'Replacement Text'
 *   })
 *   replacementText: string = '';
 * }
 * ```
 *
 * @param config Configuration object for visibility rules
 */
export function PortVisibility(config: PortVisibilityConfig): PropertyDecorator {
  return (target: object, propertyKey: any) => {
    storeVisibilityRule(target.constructor, propertyKey, config)
  }
}
