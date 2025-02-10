/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeMetadata } from '../node'

import { getNodeMetadata, getPortsMetadata } from './metadata-storage'
import 'reflect-metadata'

/**
 * Retrieves node metadata from the target using new decorators.
 * It reads the node config stored under 'chaingraph:node-config' and merges port configurations
 * (stored under 'chaingraph:ports-config') into the metadata.
 */
export function getOrCreateNodeMetadata(target: any): NodeMetadata {
  let nodeMeta: Partial<NodeMetadata> = getNodeMetadata(target.constructor)
  if (!nodeMeta) {
    nodeMeta = { type: 'undefined' }
  }
  const portsConfig: Record<string | symbol, any> = getPortsMetadata(target.constructor)

  return {
    ...nodeMeta,
    portsConfig,
  } as NodeMetadata
}
