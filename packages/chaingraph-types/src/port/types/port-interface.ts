import type { PortConfig, PortValueFromConfig } from '@chaingraph/types/port'
import type { CustomTransfomer } from 'superjson/dist/custom-transformer-registry'
import type { JSONValue } from 'superjson/dist/types'

export interface IPortSuperjsonSerializer<C extends PortConfig> extends CustomTransfomer<IPort<C>, JSONValue> {
  readonly name: string
  isApplicable: (v: any) => v is IPort<C>
  deserialize: (v: JSONValue) => IPort<C>
  serialize: (v: IPort<C>) => JSONValue
}

export interface IPort<C extends PortConfig> { // extends IPortSuperjsonSerializer<C> {
  readonly config: C
  value: PortValueFromConfig<C>

  getValue: () => PortValueFromConfig<C>
  setValue: (value: PortValueFromConfig<C>) => void
  validate: () => boolean
  reset: () => void
  hasValue: () => boolean
  clone: () => IPort<C>

  serializePort: () => JSONValue
  deserializePort: (serializedPort: JSONValue) => IPort<C>
}
