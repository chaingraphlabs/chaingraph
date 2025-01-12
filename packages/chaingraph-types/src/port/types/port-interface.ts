import type { CustomTransfomer } from 'superjson/dist/custom-transformer-registry'
import type { JSONValue } from 'superjson/dist/types'
import type { PortConfig, PortValueFromConfig } from './port-composite-types'

export interface IPort<C extends PortConfig> extends CustomTransfomer<IPort<C>, JSONValue> {
  readonly config: C
  value: PortValueFromConfig<C>

  getValue: () => PortValueFromConfig<C>
  setValue: (value: PortValueFromConfig<C>) => void
  validate: () => boolean
  reset: () => void
  hasValue: () => boolean
  clone: () => IPort<C>

  // superjson serialization methods
  readonly name: string
  isApplicable: (v: any) => v is IPort<C>
  deserialize: (v: JSONValue) => IPort<C>
  serialize: (v: IPort<C>) => JSONValue
}
