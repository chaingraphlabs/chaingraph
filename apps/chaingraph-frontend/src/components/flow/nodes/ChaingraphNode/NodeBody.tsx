/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { memo, useRef } from 'react'
import { PortComponent } from '@/components/flow/nodes/ChaingraphNode/PortComponent'
import { trace } from '@/lib/perf-trace'
import { cn } from '@/lib/utils'
import { useXYFlowNodeBodyPorts } from '@/store/xyflow'

export interface NodeBodyProps {
  nodeId: string
  className?: string
}

function NodeBody({
  nodeId,
  className = '',
}: NodeBodyProps) {
  // Trace render (synchronous - measures render function time)
  const renderCountRef = useRef(0)
  const traceSpanId = useRef<string | null>(null)
  if (trace.isEnabled()) {
    renderCountRef.current++
    traceSpanId.current = trace.start('render.NodeBody', {
      category: 'render',
      tags: { nodeId, renderCount: renderCountRef.current },
    })
  }

  // Granular subscription - only 5 fields (port IDs + parent category)
  // Component only re-renders when these specific fields change
  // OPTIMIZATION: parentNodeCategory replaces inefficient useNode(parentNodeId) call
  const portData = useXYFlowNodeBodyPorts(nodeId)

  // End trace BEFORE return (synchronous measurement)
  if (traceSpanId.current)
    trace.end(traceSpanId.current)

  // Early return if no data
  if (!portData) {
    return null
  }

  const { inputPortIds, outputPortIds, passthroughPortIds, parentNodeCategory } = portData

  return (
    <div className={cn('px-3 py-2 space-y-4', className)}>
      <div className="space-y-3">

        {/* Input Ports */}
        {inputPortIds.map((portId) => {
          return (
            <PortComponent
              key={portId}
              nodeId={nodeId}
              portId={portId}
            />
          )
        })}

        {/* Passthrough Ports */}
        {passthroughPortIds.map((portId) => {
          return (
            <PortComponent
              key={portId}
              nodeId={nodeId}
              portId={portId}
            />
          )
        })}

        {/* Output Ports */}
        {/* Only show outputs if no parent or parent is a group node */}
        {(!parentNodeCategory || parentNodeCategory === 'group') && outputPortIds.map((portId) => {
          return (
            <PortComponent
              key={portId}
              nodeId={nodeId}
              portId={portId}
            />
          )
        })}
      </div>
    </div>
  )
}

export default memo(NodeBody)
// export default memo(NodeBody, (prev, next) => {
//   return prev.node.getVersion() === next.node.getVersion()
// })
