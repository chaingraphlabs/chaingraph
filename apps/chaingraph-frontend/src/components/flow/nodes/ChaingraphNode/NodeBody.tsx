/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  PortContextValue,
} from '@/components/flow/nodes/ChaingraphNode/ports/context/PortContext'
/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */
import type { INode } from '@badaitech/chaingraph-types'
import { PortComponent } from '@/components/flow/nodes/ChaingraphNode/PortComponent'
import { cn } from '@/lib/utils'
import { useNode } from '@/store/nodes'
import { PortDirection } from '@badaitech/chaingraph-types'
import { memo, useMemo } from 'react'

export interface NodeBodyProps {
  node: INode
  context: PortContextValue
  className?: string
}

function NodeBody({
  node,
  context,
  className = '',
}: NodeBodyProps) {
  const parentNode = useNode(node.metadata.parentNodeId || '')

  const passthroughPorts = useMemo(
    () => Array.from(
      node.ports.values(),
    ).filter(port =>
      port.getConfig().direction === PortDirection.Passthrough
      && !port.getConfig().parentId
      && !port.isSystem(),
    ),
    [node],
  )

  const inputPorts = useMemo(
    () => node.getInputs().filter(
      port =>
        !port.getConfig().parentId
        && !port.isSystem(),
    ),
    [node],
  )
  const outputPorts = useMemo(
    () => node.getOutputs().filter(
      port => !port.getConfig().parentId
        && !port.isSystem(),
    ),
    [node],
  )

  return (
    <div className={cn('px-3 py-2 space-y-4', className)}>
      <div className="space-y-3">

        {/* Input Ports */}
        {inputPorts.map((port) => {
          return (
            <PortComponent
              key={port.id}
              node={node}
              port={port}
              context={context}
            />
          )
        })}

        {/* Passthrough Ports */}
        {passthroughPorts.map((port) => {
          return (
            <PortComponent
              key={port.id}
              node={node}
              port={port}
              context={context}
            />
          )
        })}

        {/* Output Ports */}
        {(!parentNode || parentNode.metadata.category === 'group') && outputPorts.map((port) => {
          return (
            <PortComponent
              key={port.id}
              node={node}
              port={port}
              context={context}
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
