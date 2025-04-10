/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EdgeData } from '../types'
import { useUnit } from 'effector-react'
import { useMemo } from 'react'
import { $edges } from '../stores'

export function useEdgesForPort(portId: string): EdgeData[] {
  const edges = useUnit($edges)

  // Filter the edges to return only those that are connected to the given port.
  // We check if either the sourcePortId or the targetPortId match the provided port id.
  return useMemo(() => {
    return edges.filter(
      edge =>
        edge.sourcePortId === portId
        || edge.targetPortId === portId,
    )
  }, [edges, portId])
}

export function useEdgesForNode(nodeId: string): EdgeData[] {
  const edges = useUnit($edges)

  // Filter the edges to return only those that are connected to the given node.
  // We check if either the sourceNodeId or the targetNodeId match the provided node id.
  return useMemo(() => {
    return edges.filter(
      edge =>
        edge.sourceNodeId === nodeId
        || edge.targetNodeId === nodeId,
    )
  }, [edges, nodeId])
}
