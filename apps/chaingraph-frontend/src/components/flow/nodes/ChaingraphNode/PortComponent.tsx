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
import type {
  AnyPortConfig,
  ArrayPortConfig,
  BooleanPortConfig,
  EnumPortConfig,
  INode,
  IPort,
  NumberPortConfig,
  ObjectPortConfig,
  StreamPortConfig,
  StringPortConfig,
} from '@badaitech/chaingraph-types'
import { BooleanPort } from '@/components/flow/nodes/ChaingraphNode/ports/BooleanPort/BooleanPort'
import { NumberPort } from '@/components/flow/nodes/ChaingraphNode/ports/NumberPort/NumberPort'
import { ObjectPort } from '@/components/flow/nodes/ChaingraphNode/ports/ObjectPort/ObjectPort'

import { StreamPort } from '@/components/flow/nodes/ChaingraphNode/ports/StreamPort/StreamPort'
import { AnyPort } from 'components/flow/nodes/ChaingraphNode/ports/AnyPort/AnyPort'
import { ArrayPort } from './ports/ArrayPort/ArrayPort'
import { PortContext } from './ports/context/PortContext'
import { EnumPort } from './ports/EnumPort/EnumPort'
import { StringPort } from './ports/StringPort/StringPort'

/**
 * PortProps interface for all components rendered through PortComponent
 * The actual dependencies needed by each port component are passed through
 * the PortContext instead of directly as props
 */
export interface PortProps {
  node: INode
  port: IPort
  context: PortContextValue
}

export function PortComponent(props: PortProps) {
  const {
    node,
    port,
    context,
  } = props

  // Safety check - if context isn't provided, try to consume from PortContext
  if (!context) {
    console.warn('PortComponent: No context provided for port', port.id)
    return (
      <PortContext.Consumer>
        {(contextValue) => {
          if (!contextValue) {
            console.error('PortContext is not available in the component tree')
            return null
          }
          return <PortComponent node={node} port={port} context={contextValue} />
        }}
      </PortContext.Consumer>
    )
  }

  switch (port.getConfig().type) {
    case 'string': {
      return (
        <StringPort node={node} port={port as IPort<StringPortConfig>} context={context} />
      )
    }
    case 'boolean': {
      return (
        <BooleanPort node={node} port={port as IPort<BooleanPortConfig>} context={context} />
      )
    }
    case 'number': {
      return (
        <NumberPort node={node} port={port as IPort<NumberPortConfig>} context={context} />
      )
    }
    case 'enum': {
      return (
        <EnumPort node={node} port={port as IPort<EnumPortConfig>} context={context} />
      )
    }
    case 'object': {
      return (
        <ObjectPort node={node} port={port as IPort<ObjectPortConfig>} context={context} />
      )
    }
    case 'array': {
      return (
        <ArrayPort node={node} port={port as IPort<ArrayPortConfig>} context={context} />
      )
    }
    // case 'secret':

    case 'any': {
      return <AnyPort node={node} port={port as IPort<AnyPortConfig>} context={context} />
    }

    case 'stream': {
      return <StreamPort node={node} port={port as IPort<StreamPortConfig>} context={context} />
    }

    default: {
      throw new Error(`Unhandled config.type case: ${port.getConfig().type}`)
    }
  }
}
