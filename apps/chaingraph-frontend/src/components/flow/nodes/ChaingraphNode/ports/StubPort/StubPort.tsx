/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */
import type { IPort, IPortConfig } from '@badaitech/chaingraph-types'
import { PortHandle } from '@/components/flow/nodes/ChaingraphNode/ports/ui/PortHandle'
import { cn } from '@/lib/utils'
import { PortTitle } from '../ui/PortTitle'

export function StubPort<C extends IPortConfig>(props: { port: IPort<C> }) {
  const { port } = props
  const config = port.getConfig()
  const title = config.title || config.key
  const ui = config.ui

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

      <PortHandle port={port} />

      {config.direction === 'input' && (
        <PortTitle>{title}</PortTitle>
      )}
    </div>
  )
}
