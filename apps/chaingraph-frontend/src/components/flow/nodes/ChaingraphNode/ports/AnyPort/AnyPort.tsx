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
import type {
  AnyPortConfig,
  AnyPort as AnyPortType,
  INode,
  IPort,
} from '@badaitech/chaingraph-types'
import { PortComponent } from '@/components/flow/nodes/ChaingraphNode/PortComponent'
import { cn } from '@/lib/utils'
import { requestUpdatePortUI } from '@/store/ports'
import {
  PortFactory,
} from '@badaitech/chaingraph-types'
import { memo, useMemo } from 'react'
import { PortHandle } from '../ui/PortHandle'
import { PortTitle } from '../ui/PortTitle'

export interface AnyPortProps {
  node: INode
  port: IPort<AnyPortConfig>
  context: PortContextValue
}

function AnyPortComponent(props: AnyPortProps) {
  const { port, node, context } = props

  const config = useMemo(() => (port as AnyPortType).getRawConfig(), [port])

  const underlyingType = useMemo(() => {
    return (port as AnyPortType).unwrapUnderlyingType()
  }, [port])

  const underlyingPort = useMemo(() => {
    if (!underlyingType || underlyingType.type === 'any' || !config.id)
      return undefined

    const newPort = underlyingType
      ? PortFactory.create({
          ...underlyingType,
          id: config.id,
          parentId: config.parentId,
          direction: config.direction,
          required: config.required,
          key: config.key,
          connections: config.connections,
          ui: {
            ...config,
            // bgColor: underlyingType.ui?.bgColor || config.ui?.bgColor,
            // borderColor: underlyingType.ui?.borderColor || config.ui?.borderColor,
            // ...underlyingType.ui,
          },
        })
      : undefined

    if (newPort) {
      // set value from the original port if it exists
      newPort.setValue(port.getValue())
    }

    console.log('AnyPortComponent: underlying port created', port)

    return newPort
  }, [config, port, underlyingType])

  const ui = config.ui
  const title = config.title || config.key

  // if (config.underlyingType?.type === 'object') {
  //   return <AnyObjectPort node={node} port={port as IPort<AnyPortConfig>} context={context} />
  // }

  if (underlyingPort && underlyingType?.type !== 'any') {
    return (
      <PortComponent node={node} port={underlyingPort as IPort} context={context} />
    )
  }

  //
  // if (underlyingPort && underlyingType?.type === 'array') {
  //   // return <AnyObjectPort node={node} port={port as IPort<AnyPortConfig>} context={context} />
  //   return <ArrayPort node={node} port={underlyingPort as IPort<ArrayPortConfig>} context={context} />
  // }

  if (ui?.hidden)
    return null

  return (
    <div
      key={config.id}
      className={cn(
        'relative flex gap-2 group/port',
        config.direction === 'output' ? 'justify-end' : 'justify-start',
      )}
    >
      {(config.direction === 'input' || config.direction === 'passthrough')
        && <PortHandle port={port} forceDirection="input" />}

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
            && (port.getValue() === undefined || port.getValue() === null || !port.validate())
            && (config.direction === 'input' || config.direction === 'passthrough')
            && (config.connections?.length || 0) === 0
            && 'underline decoration-red-500 decoration-2',
          )}
          onClick={() => {
            requestUpdatePortUI({
              nodeId: node.id,
              portId: port.id,
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
            port={port}
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
