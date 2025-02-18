import type { ExtractValue, IPort, IPortConfig } from '@badaitech/chaingraph-types'
/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */
import type { PortOnChangeParam } from './Port'
import { requestUpdatePortValue } from '@/store/ports/events'
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

function initPortsStates(ports: IPort[]) {
  return ports.reduce<Record<string, PortState>>((acc, port) => {
    const isValid = port.validate()
    acc[port.id] = {
      value: port.getValue(),
      isValid: port.validate(),
    }

    return acc
  }, {})
}

export function NodeBody({ inputs, outputs }: NodeBodyProps) {
  const [inputsStates, setInputsStates] = useState(initPortsStates(inputs))
  const [outputStates, setOutputStates] = useState(initPortsStates(outputs))

  // TODO: remove it and subscribe on changes from backend
  useEffect(() => {
    setInputsStates(initPortsStates(inputs))
  }, [inputs])

  useEffect(() => {
    setOutputStates(initPortsStates(outputs))
  }, [outputs])

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

  const createChangeOutputPortHandler = <C extends IPortConfig>(port: IPort<C>) => ({ value }: PortOnChangeParam<C>) => {
    let isValid = true
    try {
      port.setValue(value)
    } catch (error) {
      isValid = false
      console.error(error)
    }

    //  it's overhead to have this state. we should use only one store
    setOutputStates(states => ({ ...states, [port.id]: {
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
          const { value, isValid } = outputStates[port.id]

          return (
            <Port
              key={port.id}
              port={port}
              value={value}
              errorMessage={isValid ? undefined : 'invalid'}
              onChange={createChangeOutputPortHandler(port)}
            />
          )
        })}
      </div>
    </div>
  )
}
