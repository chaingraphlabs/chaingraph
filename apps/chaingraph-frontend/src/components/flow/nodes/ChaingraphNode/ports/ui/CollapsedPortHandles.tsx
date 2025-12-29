/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ReactNode } from 'react'
import { Handle, Position } from '@xyflow/react'
import { useStoreMap } from 'effector-react'
import { Fragment, memo } from 'react'
import { $collapsedHandleData } from '@/store/ports-v2/collapsed-handles'
import { toPortKey } from '@/store/ports-v2/utils'

/**
 * Renders hidden XYFlow handles for ALL descendants of a collapsed port.
 *
 * Purpose:
 * - When a port is collapsed (object/array), its children are hidden visually
 * - BUT edges must still connect properly
 * - This component renders invisible handles for all nested descendants
 * - Edges appear to connect to the collapsed parent's location
 *
 * Performance:
 * - Reads from pre-computed $collapsedHandleData store (zero computation cost)
 * - Only re-renders when THIS port's collapsed handle data changes
 * - Uses granular useStoreMap with updateFilter
 *
 * Features:
 * - **Recursive**: Handles ALL descendants (unlimited depth via $portDescendants)
 * - **Passthrough support**: Renders TWO handles (input + output) for passthrough ports
 * - **Optimized reactivity**: Only updates when descendants/configs/collapse state changes
 * - **Memory efficient**: Store only holds collapsed ports (not all ports)
 *
 * @param nodeId - Node containing the port
 * @param parentPortId - The collapsed parent port
 */
export const CollapsedPortHandles = memo(({
  nodeId,
  parentPortId,
}: {
  nodeId: string
  parentPortId: string
}): ReactNode => {
  const portKey = toPortKey(nodeId, parentPortId)

  // Read pre-computed handle data from derived store (O(1) lookup)
  const handleInfos = useStoreMap({
    store: $collapsedHandleData,
    keys: [portKey],
    fn: (data, [key]) => data.get(key) || [],
    updateFilter: (prev, next) => {
      // Deep equality check on array
      if (prev.length !== next.length)
        return true

      for (let i = 0; i < prev.length; i++) {
        const p = prev[i]
        const n = next[i]
        if (
          p.portId !== n.portId
          || p.configId !== n.configId
          || p.hasInput !== n.hasInput
          || p.hasOutput !== n.hasOutput
        ) {
          return true
        }
      }

      return false
    },
  })

  // Early return if no collapsed handles
  if (handleInfos.length === 0) {
    return null
  }

  return (
    <>
      {handleInfos.map(info => (
        <Fragment key={info.portId}>
          {/* Input handle (left side) */}
          {info.hasInput && (
            <Handle
              key={`${info.configId}-input`}
              id={info.configId}
              type="target"
              position={Position.Left}
              style={{ opacity: 0, pointerEvents: 'none' }}
              isConnectable={false}
            />
          )}

          {/* Output handle (right side) */}
          {info.hasOutput && (
            <Handle
              key={`${info.configId}-output`}
              id={info.configId}
              type="source"
              position={Position.Right}
              style={{ opacity: 0, pointerEvents: 'none' }}
              isConnectable={false}
            />
          )}
        </Fragment>
      ))}
    </>
  )
})
