/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ArrayPortConfig,
  BooleanPortConfig,
  EnumPortConfig,
  INode,
  IPort,
  NumberPortConfig,
  ObjectPortConfig,
  StringPortConfig,
} from '@badaitech/chaingraph-types'
import {
  BooleanPort,
} from '@/components/flow/nodes/ChaingraphNode/ports/BooleanPort/BooleanPort.tsx'
import { NumberPort } from '@/components/flow/nodes/ChaingraphNode/ports/NumberPort/NumberPort.tsx'
import { ObjectPort } from '@/components/flow/nodes/ChaingraphNode/ports/ObjectPort/ObjectPort.tsx'
import { ArrayPort } from './ports/ArrayPort/ArrayPort'
import { EnumPort } from './ports/EnumPort/EnumPort'
import { StringPort } from './ports/StringPort/StringPort'
import { StubPort } from './ports/StubPort/StubPort'

/**
 * PortProps interface for all components rendered through PortComponent
 * The actual dependencies needed by each port component are passed through
 * the PortContext instead of directly as props
 */
export interface PortProps {
  node: INode
  port: IPort
}

export function PortComponent(props: PortProps) {
  const {
    node,
    port,
  } = props

  switch (port.getConfig().type) {
    case 'string': {
      return (
        <StringPort node={node} port={port as IPort<StringPortConfig>} />
      )
    }
    case 'boolean': {
      return (
        <BooleanPort node={node} port={port as IPort<BooleanPortConfig>} />
      )
    }
    case 'number': {
      return (
        <NumberPort node={node} port={port as IPort<NumberPortConfig>} />
      )
    }
    case 'enum': {
      return (
        <EnumPort node={node} port={port as IPort<EnumPortConfig>} />
      )
    }
    case 'object': {
      return (
        <ObjectPort node={node} port={port as IPort<ObjectPortConfig>} />
      )
    }
    case 'array': {
      return (
        <ArrayPort node={node} port={port as IPort<ArrayPortConfig>} />
      )
    }
    case 'stream':
    case 'any': {
      return <StubPort port={port} />
    }

    default: {
      throw new Error(`Unhandled config.type case: ${port.getConfig().type}`)
    }
  }
}
