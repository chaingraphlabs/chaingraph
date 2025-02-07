import type { PortOnChangeParam } from './Port'
import { updatePortValue } from '@badaitech/chaingraph-frontend/store/ports/events'
import { type ExtractValue, type IPort, type IPortConfig, PortDirection } from '@badaitech/chaingraph-types'
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

    updatePortValue({ id: port.id, value })
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
