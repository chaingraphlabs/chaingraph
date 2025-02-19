/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExtractValue, IPort, IPortConfig } from '@badaitech/chaingraph-types'
import type { BooleanPortProps } from './ports/BooleanPort/BooleanPort'
import type { EnumPortProps } from './ports/EnumPort/EnumPort'
import type { NumberPortProps } from './ports/NumberPort/NumberPort'
import type { ObjectPortProps } from './ports/ObjectPort/ObjectPort'
import type { StringPortProps } from './ports/StringPort/StringPort'
import type { PortOnChangeParam } from './types'
import { EnumPort } from '@/components/flow/nodes/ChaingraphNode/ports/EnumPort/EnumPort.tsx'
import { useNodeContext } from './context'
import { BooleanPort } from './ports/BooleanPort/BooleanPort'
import { NumberPort } from './ports/NumberPort/NumberPort'
import { ObjectPort } from './ports/ObjectPort/ObjectPort'
import { StringPort } from './ports/StringPort/StringPort'
import { StubPort } from './ports/StubPort/StubPort'

export interface PortProps<C extends IPortConfig> {
  className?: string
  port: IPort<C>
  portClassName?: string
  value?: ExtractValue<C>
  onChange?: (param: PortOnChangeParam<C>) => void
  onDelete?: (port: IPort<C>) => void
  errorMessage?: string
}

export function Port<C extends IPortConfig>(props: PortProps<C>) {
  const { inputs, outputs, inputsStates, outputsStates, createChangeInputPortHandler } = useNodeContext()
  const { port } = props
  const config = port.getConfig()

  switch (config.type) {
    case 'string': {
      return <StringPort {...props as unknown as StringPortProps} />
    }
    case 'boolean': {
      return <BooleanPort {...props as unknown as BooleanPortProps} />
    }
    case 'number': {
      return <NumberPort {...props as unknown as NumberPortProps} />
    }
    case 'enum': {
      return <EnumPort {...props as unknown as EnumPortProps} />
    }
    case 'object': {
      return (
        <ObjectPort
          {...props as unknown as ObjectPortProps}
          renderPort={({ portConfig, isOpen, isSchemaMutable }) => {
            const ports = portConfig.direction === 'input' ? inputs : outputs
            const states = portConfig.direction === 'input' ? inputsStates : outputsStates
            const port = ports.find(({ id }) => portConfig.id === id)

            if (!port)
              return null

            const { isValid, value } = states[port.id]

            return (
              <Port
                className={isOpen ? 'relative' : 'static'}
                portClassName={isOpen ? 'z-0' : '-z-10'}
                port={port}
                value={value}
                errorMessage={isValid ? undefined : 'invalid'}
                onDelete={isSchemaMutable
                  ? () => {
                      console.log('delete')
                    }
                  : undefined}
                onChange={createChangeInputPortHandler(port)}
              />
            )
          }}
        />
      )
    }
    case 'array':
    case 'stream':
    case 'any': {
      return <StubPort port={port} />
    }

    default: {
      throw new Error(`Unhandled config.type case: ${config}`)
    }
  }
}
