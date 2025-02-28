/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import {
  BaseEdge,
  type Edge,
  type EdgeProps,
  getStraightPath,
} from '@xyflow/react'

type CustomEdgeType = Edge<{ value: number }, 'custom'>

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
}: EdgeProps<CustomEdgeType>) {
  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY })

  return <BaseEdge id={id} path={edgePath} />
}
