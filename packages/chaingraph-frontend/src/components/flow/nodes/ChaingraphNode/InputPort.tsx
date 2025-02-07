import type { ExtractValue, IPort, IPortConfig } from '@badaitech/chaingraph-types'
import type { BooleanInputPortProps } from './ports/BooleanPort/BooleanInputPort'
import type { StringInputPortProps } from './ports/StringPort/StringInputPort'
import { BooleanInputPort } from './ports/BooleanPort/BooleanInputPort'
import { StringInputPort } from './ports/StringPort/StringInputPort'
import { StubPort } from './ports/StubPort/StubPort'

export interface InputPortOnChangeParam<C extends IPortConfig> { value: ExtractValue<C> }

export interface InputPortProps<C extends IPortConfig> {
  port: IPort<C>
  value: ExtractValue<C>
  onChange: (param: InputPortOnChangeParam<C>) => void
  errorMessage?: string
}

export function InputPort<C extends IPortConfig>(props: InputPortProps<C>) {
  const { port } = props
  const config = port.getConfig()

  switch (config.type) {
    case 'string': {
      return <StringInputPort {...props as unknown as StringInputPortProps} />
    }
    case 'boolean': {
      return <BooleanInputPort {...props as unknown as BooleanInputPortProps} config={config} />
    }
    case 'number': {
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
