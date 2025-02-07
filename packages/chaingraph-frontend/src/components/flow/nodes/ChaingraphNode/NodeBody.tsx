import type { ExtractValue, IPort, IPortConfig } from '@badaitech/chaingraph-types'
import type { InputPortOnChangeParam, InputPortProps } from './InputPort'
import { Fragment, type ReactNode, useState } from 'react'
import { InputPort } from './InputPort'
import { BooleanOutputPort } from './ports/BooleanPort/BooleanOutputPort'
import { StringOutputPort } from './ports/StringPort/StringOutputPort'
import { StubPort } from './ports/StubPort/StubPort'

interface NodeBodyProps {
  inputs: IPort[]
  outputs: IPort[]
}

interface PortState< C extends IPortConfig = IPortConfig> {
  value: ExtractValue<C>
  isValid: boolean,
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

  const createChangeInputPortHandler = <C extends IPortConfig>(port: IPort<C>) => ({ value }: InputPortOnChangeParam<C>) => {
    port.setValue(value)
    setInputsStates(states => ({ ...states, [port.id]: {
      value,
      isValid: port.validate(),
    } }))
  }

  return (
    <div className="px-3 py-2 space-y-4">
      <div className="space-y-3">

        {/* Input Ports */}
        {inputs.map((port) => {
          const { value, isValid } = inputsStates[port.id]

          return (
            <InputPort
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
          return <Fragment key={port.id}>{renderOutputPort(port)}</Fragment>
        })}
      </div>
    </div>
  )
}

function renderOutputPort(port: IPort): ReactNode {
  const config = port.getConfig()
  switch (config.type) {
    case 'string': {
      return <StringOutputPort config={config} />
    }
    case 'boolean': {
      return <BooleanOutputPort config={config} />
    }
    case 'number':
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
