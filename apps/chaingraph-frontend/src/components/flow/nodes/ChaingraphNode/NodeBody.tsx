/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '@badaitech/chaingraph-types'
import { PortDirection } from '@badaitech/chaingraph-types'
import { memo, useMemo, useRef } from 'react'
import { PortComponent } from '@/components/flow/nodes/ChaingraphNode/PortComponent'
import { trace } from '@/lib/perf-trace'
import { cn } from '@/lib/utils'
import { useNode } from '@/store/nodes'

export interface NodeBodyProps {
  node: INode
  className?: string
}

function NodeBody({
  node,
  className = '',
}: NodeBodyProps) {
  // Trace render (synchronous - measures render function time)
  const renderCountRef = useRef(0)
  const traceSpanId = useRef<string | null>(null)
  if (trace.isEnabled()) {
    renderCountRef.current++
    traceSpanId.current = trace.start('render.NodeBody', {
      category: 'render',
      tags: { nodeId: node.id, renderCount: renderCountRef.current },
    })
  }

  const parentNode = useNode(node.metadata.parentNodeId || '')

  const passthroughPorts = useMemo(
    () => trace.wrap('compute.passthroughPorts', { category: 'compute' }, () =>
      Array.from(
        node.ports.values(),
      ).filter(port =>
        port.getConfig().direction === PortDirection.Passthrough
        && !port.getConfig().parentId
        && !port.isSystem(),
      ),
    ),
    [node],
  )

  const inputPorts = useMemo(
    () => trace.wrap('compute.inputPorts', { category: 'compute' }, () =>
      node.getInputs().filter(
        port =>
          !port.getConfig().parentId
          && !port.isSystem(),
      ),
    ),
    [node],
  )
  const outputPorts = useMemo(
    () => trace.wrap('compute.outputPorts', { category: 'compute' }, () =>
      node.getOutputs().filter(
        port => !port.getConfig().parentId
          && !port.isSystem(),
      ),
    ),
    [node],
  )

  // End trace BEFORE return (synchronous measurement)
  if (traceSpanId.current) trace.end(traceSpanId.current)

  return (
    <div className={cn('px-3 py-2 space-y-4', className)}>
      <div className="space-y-3">

        {/* Input Ports */}
        {inputPorts.map((port) => {
          return (
            <PortComponent
              key={port.id}
              nodeId={node.id}
              portId={port.id}
            />
          )
        })}

        {/* Passthrough Ports */}
        {passthroughPorts.map((port) => {
          return (
            <PortComponent
              key={port.id}
              nodeId={node.id}
              portId={port.id}
            />
          )
        })}

        {/* Output Ports */}
        {(!parentNode || parentNode.metadata.category === 'group') && outputPorts.map((port) => {
          return (
            <PortComponent
              key={port.id}
              nodeId={node.id}
              portId={port.id}
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
