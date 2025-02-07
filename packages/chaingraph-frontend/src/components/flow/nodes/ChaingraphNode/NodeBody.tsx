/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPort } from '@badaitech/chaingraph-types'
import { Fragment, type ReactNode } from 'react'
import { StringInputPort } from './ports/StringPort/StringInputPort'
import { StringOutputPort } from './ports/StringPort/StringOutputPort'
import { StubPort } from './ports/StubPort/StubPort'

interface NodeBodyProps {
  inputs: IPort[]
  outputs: IPort[]
}

export function NodeBody({ inputs, outputs }: NodeBodyProps) {
  return (
    <div className="px-3 py-2 space-y-4">
      <div className="space-y-3">

        {/* Input Ports */}
        {inputs.map((port) => {
          return (
            <Fragment key={port.id}>{renderInputPort(port)}</Fragment>
          )
        })}

        {/* Output Ports */}
        {outputs.map((port) => {
          return <Fragment key={port.id}>{renderOutputPort(port)}</Fragment>
        })}
      </div>
    </div>
  )
}

function renderInputPort(port: IPort): ReactNode {
  const config = port.getConfig()

  switch (config.type) {
    case 'string': {
      return (
        <StringInputPort
          config={config}
        />
      )
    }
    case 'number': {
      return <StubPort config={config} />
    }
    case 'boolean': {
      return <StubPort config={config} />
    }
    case 'enum': {
      return <StubPort config={config} />
    }
    case 'array': {
      return <StubPort config={config} />
    }
    case 'object': {
      return <StubPort config={config} />
    }
    case 'stream': {
      return <StubPort config={config} />
    }
    case 'any': {
      return <StubPort config={config} />
    }

    default: {
      throw new Error(`Unhandled config.type case: ${config}`)
    }
  }
}

function renderOutputPort(port: IPort): ReactNode {
  const config = port.getConfig()
  switch (config.type) {
    case 'string': {
      return <StringOutputPort config={config} />
    }
    case 'number':
    case 'boolean':
    case 'enum':
    case 'array':
    case 'object':
    case 'stream':
    case 'any': {
      return <StubPort config={config} />
    }
    default: {
      throw new Error(`Unhandled config.type case: ${config}`)
    }
  }
}
