/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode, IPort } from '@badaitech/chaingraph-types'
// Create a derived store that combines ports from all nodes
import { $nodes } from '../nodes/stores'

export const $ports = $nodes.map((nodes: Record<string, INode>) => {
  const portsIndex: Record<string, IPort> = {}

  // Iterate over each node
  Object.keys(nodes).forEach((nodeId) => {
    const node = nodes[nodeId]
    node.ports.forEach((port: IPort, portId: string) => {
      // Create a unique key (e.g. "nodeId-portId")
      portsIndex[`${nodeId}-${portId}`] = port
    })
  })

  return portsIndex
})
