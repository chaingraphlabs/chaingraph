import type { ArrayPortConfig, IPort, StringPortConfig } from '@chaingraph/types/port/types'
import { PortFactory } from '@chaingraph/types/port/port-factory'

const elementConfig: StringPortConfig = {
  id: 'element1',
  name: 'String Element',
  kind: 'string',
}

const arrayPortConfig: ArrayPortConfig<StringPortConfig> = {
  id: 'port3',
  name: 'Array of Strings Port',
  kind: 'array',
  elementConfig,
  defaultValue: ['foo', 'bar', 'baz'],
}

const arrayPort: IPort<ArrayPortConfig<StringPortConfig>> = PortFactory.create(arrayPortConfig)

// Accessing the value
console.log(arrayPort.getValue()) // Output: ['foo', 'bar', 'baz']
