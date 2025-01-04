import type { PortConfig, PortValueFromConfig } from '@chaingraph/types/port'

export interface IPort<C extends PortConfig> {
  readonly config: C
  value: PortValueFromConfig<C>

  getValue: () => PortValueFromConfig<C>
  setValue: (value: PortValueFromConfig<C>) => void
  validate: () => Promise<boolean>
  reset: () => void
  hasValue: () => boolean
  clone: () => IPort<C>
}
