/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPort } from '@badaitech/chaingraph-types'
import { useUnit } from 'effector-react'
import { useMemo } from 'react'
import { $nodes } from '../nodes'

export function usePort(nodeId: string, portId: string) {
  const nodes = useUnit($nodes)

  const ports = useMemo(() => {
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
  }, [nodes])

  return useMemo(
    () => ports[`${nodeId}-${portId}`],
    [ports, nodeId, portId],
  )
}
