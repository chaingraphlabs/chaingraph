import type { ExtractValue, IPort, IPortConfig } from '@badaitech/chaingraph-types'
import type { BooleanPortProps } from './ports/BooleanPort/BooleanPort'
import type { EnumPortProps } from './ports/EnumPort/EnumPort'
import type { NumberPortProps } from './ports/NumberPort/NumberPort'
import type { ObjectPortProps } from './ports/ObjectPort/ObjectPort'
import type { StringPortProps } from './ports/StringPort/StringPort'
import { EnumPort } from '@/components/flow/nodes/ChaingraphNode/ports/EnumPort/EnumPort.tsx'
import { BooleanPort } from './ports/BooleanPort/BooleanPort'
import { NumberPort } from './ports/NumberPort/NumberPort'
import { ObjectPort } from './ports/ObjectPort/ObjectPort'
import { StringPort } from './ports/StringPort/StringPort'
import { StubPort } from './ports/StubPort/StubPort'
import { useNodeContext } from './context'
import { PortOnChangeParam } from './types'



export interface PortProps<C extends IPortConfig> {
  port: IPort<C>
  value?: ExtractValue<C>
  onChange?: (param: PortOnChangeParam<C>) => void
  errorMessage?: string
}

export function Port<C extends IPortConfig>(props: PortProps<C>) {
  const {inputs, outputs, inputsStates, outputsStates, createChangeInputPortHandler} = useNodeContext();
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
          renderPort={({ portConfig }) => {
            const ports = portConfig.direction === 'input' ? inputs : outputs
            const states = portConfig.direction === 'input'  ? inputsStates : outputsStates
            const port = ports.find(({ id }) => portConfig.id === id)

            if (!port)
              return null

            const {isValid, value} =  states[port.id]
            
            return <Port port={port} value={value} errorMessage={isValid ? undefined : 'invalid'} onChange={createChangeInputPortHandler(port)} />
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
