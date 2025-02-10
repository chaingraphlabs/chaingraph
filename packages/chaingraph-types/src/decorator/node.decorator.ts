/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeMetadata } from '../node/types'
import type { NodeConstructor } from './registry'
import { getOrCreateNodeMetadata } from './getOrCreateNodeMetadata'
import { getNodeMetadata, setNodeMetadata } from './metadata-storage'
import { NodeRegistry } from './registry'

import 'reflect-metadata'

/**
 * Node decorator that stores node metadata.
 * It uses the already existing NodeMetadata type.
 */
export function Node(config: Omit<NodeMetadata, 'type'>, nodeRegistry?: NodeRegistry | null): ClassDecorator {
  return function (target: Function) {
    const metadata = getOrCreateNodeMetadata(target.prototype)
    Object.assign(metadata, config)

    metadata.type = target.name

    if (config.id) {
      metadata.id = config.id
    }

    setNodeMetadata(target, metadata)

    const checkMeta = getNodeMetadata(target)

    if (nodeRegistry) {
      nodeRegistry.registerNode(target as NodeConstructor)
    } else {
      NodeRegistry.getInstance().registerNode(target as NodeConstructor)
    }
  }
}
