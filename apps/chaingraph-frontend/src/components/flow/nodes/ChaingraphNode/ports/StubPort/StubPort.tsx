/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */
import { PortHandle } from '@/components/flow/nodes/ChaingraphNode/ports/ui/PortHandle'
import { cn } from '@/lib/utils'
import { usePortConfigWithExecution, usePortUIWithExecution } from '@/store/execution/hooks/usePortValueWithExecution'
import { PortTitle } from '../ui/PortTitle'

export function StubPort(props: { nodeId: string, portId: string }) {
  const { nodeId, portId } = props
  const config = usePortConfigWithExecution(nodeId, portId)
  const ui = usePortUIWithExecution(nodeId, portId)

  if (!config)
    return null

  const title = config.title || config.key

  if (ui?.hidden)
    return null

  return (
    <div
      key={config.id}
      className={cn(
        'relative flex items-center gap-2 group/port',
        config.direction === 'output' ? 'justify-end' : 'justify-start',
        'truncate',
        'h-20',
      )}
    >
      {config.direction === 'output' && (
        <PortTitle>
          {title}
        </PortTitle>
      )}

      <PortHandle nodeId={nodeId} portId={portId} />

      {config.direction === 'input' && (
        <PortTitle>{title}</PortTitle>
      )}
    </div>
  )
}
