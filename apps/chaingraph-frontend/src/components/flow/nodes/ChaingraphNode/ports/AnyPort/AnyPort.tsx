/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { memo } from 'react'
import { cn } from '@/lib/utils'
import { usePortConfigWithExecution, usePortUIWithExecution } from '@/store/execution/hooks/usePortValueWithExecution'
import { requestUpdatePortUI } from '@/store/ports'
import { usePortConfig, usePortUI } from '@/store/ports-v2'
import { ArrayPort } from '../ArrayPort/ArrayPort'
import { BooleanPort } from '../BooleanPort/BooleanPort'
import { EnumPort } from '../EnumPort/EnumPort'
import { NumberPort } from '../NumberPort/NumberPort'
import { ObjectPort } from '../ObjectPort/ObjectPort'
import { SecretPort } from '../SecretPort/SecretPort'
import { StreamPort } from '../StreamPort/StreamPort'
import { StringPort } from '../StringPort/StringPort'
import { PortHandle } from '../ui/PortHandle'
import { PortTitle } from '../ui/PortTitle'

/**
 * AnyPort component
 *
 * Renders a generic "any" type port that hasn't been specialized to a specific type.
 * If a port has an underlyingType, the store automatically unwraps it via unwrapAnyPortConfig(),
 * changing config.type to the actual type, causing PortComponent to route to the appropriate
 * specialized component (StringPort, ArrayPort, etc.) instead of this component.
 */
export interface AnyPortProps {
  nodeId: string
  portId: string
}

function AnyPortComponent(props: AnyPortProps) {
  const { nodeId, portId } = props

  // Granular subscriptions
  const config = usePortConfigWithExecution(nodeId, portId)
  const ui = usePortUIWithExecution(nodeId, portId)

  // Early return if config not loaded yet
  if (!config)
    return null

  if (ui?.hidden)
    return null

  // Check if there's an underlying type (stored in config)
  // const underlyingType = (config as any).underlyingType

  // NOTE: Configs are now unwrapped in the store via unwrapAnyPortConfig()
  // If this component is reached, it means the config has type='any' with NO underlyingType
  // (truly generic any port that hasn't been specialized yet).
  //
  // If there was an underlyingType, the store would have unwrapped it and changed config.type
  // to the actual type (e.g., 'string', 'array'), causing PortComponent to route to the
  // appropriate component (StringPort, ArrayPort, etc.) instead of AnyPort.
  //
  // Therefore, we just render a simple generic port display here.
  // if (underlyingType && underlyingType.type && underlyingType.type !== 'any') {
  //   switch (underlyingType.type) {
  //     // TODO: some issue with array rendering. Actually we have to unwrap the underlying type somehow and pass full config or unwrap on the port component?
  //     case 'string':
  //       return <StringPort nodeId={nodeId} portId={portId} />
  //     case 'number':
  //       return <NumberPort nodeId={nodeId} portId={portId} />
  //     case 'boolean':
  //       return <BooleanPort nodeId={nodeId} portId={portId} />
  //     case 'object':
  //       return <ObjectPort nodeId={nodeId} portId={portId} />
  //     case 'array':
  //       return <ArrayPort nodeId={nodeId} portId={portId} />
  //     case 'enum':
  //       return <EnumPort nodeId={nodeId} portId={portId} />
  //     case 'secret':
  //       return <SecretPort nodeId={nodeId} portId={portId} />
  //     case 'stream':
  //       return <StreamPort nodeId={nodeId} portId={portId} />
  //     // For unknown types, fall through to default 'any' rendering below
  //   }
  // }

  const title = config.title || config.key

  return (
    <div
      key={config.id}
      className={cn(
        'relative flex gap-2 group/port',
        config.direction === 'output' ? 'justify-end' : 'justify-start',
      )}
    >
      {(config.direction === 'input' || config.direction === 'passthrough')
        && <PortHandle nodeId={nodeId} portId={portId} forceDirection="input" />}

      <div className={cn(
        'flex flex-col',
        config.direction === 'output' ? 'items-end' : 'items-start',
      )}
      >
        <PortTitle
          className={cn(
            'cursor-pointer',
            // if port required and the value is empty, add a red underline
            config.required
            && (config.direction === 'input' || config.direction === 'passthrough')
            && 'underline decoration-red-500 decoration-2',
          )}
          onClick={() => {
            requestUpdatePortUI({
              nodeId,
              portId,
              ui: {
                hideEditor: ui?.hideEditor === undefined ? true : !ui.hideEditor,
              },
            })
          }}
        >
          {title}
        </PortTitle>

      </div>

      {
        (config.direction === 'output' || config.direction === 'passthrough')
        && (
          <PortHandle
            nodeId={nodeId}
            portId={portId}
            forceDirection="output"
            className={cn(
              config.parentId !== undefined
              && config.direction === 'passthrough'
              && '-right-8',
            )}
          />
        )
      }
    </div>
  )
}

// Export a memoized version of the component to prevent unnecessary re-renders
export const AnyPort = memo(AnyPortComponent)
