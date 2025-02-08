import type { ExtractValue, IPort, IPortConfig } from '@badaitech/chaingraph-types'
/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */
import type { PortOnChangeParam } from './Port'
import { requestUpdatePortValue } from '@badaitech/chaingraph-frontend/store/ports/events'
import { useEffect, useState } from 'react'
import { Port } from './Port'

interface NodeBodyProps {
  inputs: IPort[]
  outputs: IPort[]
}

interface PortState< C extends IPortConfig = IPortConfig> {
  value: ExtractValue<C>
  isValid: boolean
}

function initInputsStates(inputs: IPort[]) {
  return inputs.reduce<Record<string, PortState>>((acc, input) => {
    acc[input.id] = {
      value: input.getValue(),
      isValid: input.validate(),
    }

    return acc
  }, {})
}

export function NodeBody({ inputs, outputs }: NodeBodyProps) {
  const [inputsStates, setInputsStates] = useState(initInputsStates(inputs))

  // TODO: remove it and subscribe on changes from backend
  useEffect(() => {
    setInputsStates(initInputsStates(inputs))
  }, [inputs])

  const createChangeInputPortHandler = <C extends IPortConfig>(port: IPort<C>) => ({ value }: PortOnChangeParam<C>) => {
    let isValid = true
    try {
      port.setValue(value)
    } catch (error) {
      isValid = false
      console.error(error)
    }

    //  it's overhead to have this state. we should use only one store
    setInputsStates(states => ({ ...states, [port.id]: {
      value,
      isValid,
    } }))

    requestUpdatePortValue({ id: port.id, value })
  }

  return (
    <div className="px-3 py-2 space-y-4">
      <div className="space-y-3">

        {/* Input Ports */}
        {inputs.map((port) => {
          const { value, isValid } = inputsStates[port.id]

          return (
            <Port
              key={port.id}
              port={port}
              value={value}
              errorMessage={isValid ? undefined : 'invalid'}
              onChange={createChangeInputPortHandler(port)}
            />
          )
        })}

        {/* Output Ports */}
        {outputs.map((port) => {
          return <Port key={port.id} port={port} />
        })}
      </div>
    </div>
  )
}
