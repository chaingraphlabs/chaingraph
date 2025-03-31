/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  PortContextValue,
} from '@/components/flow/nodes/ChaingraphNode/ports/context/PortContext.tsx'
/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */
import type { INode } from '@badaitech/chaingraph-types'
import { PortComponent } from 'components/flow/nodes/ChaingraphNode/PortComponent.tsx'
import { useMemo } from 'react'

export interface NodeBodyProps {
  node: INode
  context: PortContextValue
}

function NodeBody({
  node,
  context,
}: NodeBodyProps) {
  const inputPorts = useMemo(
    () => node.getInputs().filter(
      port =>
        !port.getConfig().parentId
        && port.getConfig().metadata?.isSystemPort !== true,
    ),
    [node],
  )
  const outputPorts = useMemo(
    () => node.getOutputs().filter(
      port => !port.getConfig().parentId
        && port.getConfig().metadata?.isSystemPort !== true,
    ),
    [node],
  )

  return (
    <div className="px-3 py-2 space-y-4">
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

        {/* Output Ports */}
        {outputPorts.map((port) => {
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

// export default memo(NodeBody)
export default NodeBody
