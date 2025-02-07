import type { ExtractValue, IPort, IPortConfig } from '@badaitech/chaingraph-types'
import type { BooleanPortProps } from './ports/BooleanPort/BooleanPort'
import type { NumberPortProps } from './ports/NumberPort/NumberPort'
import type { StringPortProps } from './ports/StringPort/StringPort'
import { BooleanPort } from './ports/BooleanPort/BooleanPort'
import { NumberPort } from './ports/NumberPort/NumberPort'
import { StringPort } from './ports/StringPort/StringPort'
import { StubPort } from './ports/StubPort/StubPort'

export interface PortOnChangeParam<C extends IPortConfig> { value: ExtractValue<C> }

export interface PortProps<C extends IPortConfig> {
  port: IPort<C>
  value?: ExtractValue<C>
  onChange?: (param: PortOnChangeParam<C>) => void
  errorMessage?: string
}

export function Port<C extends IPortConfig>(props: PortProps<C>) {
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
    case 'enum':
    case 'array':
    case 'object':
    case 'stream':
    case 'any': {
      return <StubPort port={port} />
    }

    default: {
      throw new Error(`Unhandled config.type case: ${config}`)
    }
  }
}
