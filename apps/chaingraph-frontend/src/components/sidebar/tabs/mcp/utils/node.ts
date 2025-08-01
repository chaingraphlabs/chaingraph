/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode, IPortConfig, NodeMetadataWithPorts } from '@badaitech/chaingraph-types'

/**
 * Build NodeMetadataWithPorts from a pre-built INode
 */
export function buildNodeMetadataWithPorts(node: INode): NodeMetadataWithPorts {
  const portsConfig = new Map<string, IPortConfig>()

  // INode has a ports property that is Map<string, IPort>
  node.ports.forEach((port, key) => {
    if (!port.isSystem() && !port.getConfig().parentId) {
      portsConfig.set(key, port.getConfig())
    }
  })

  return {
    ...node.metadata,
    portsConfig,
  }
}
