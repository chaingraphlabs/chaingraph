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

// export abstract class Port<C extends PortConfig> implements Port<C> {
//   readonly config: C
//   value: PortValueFromConfig<C>
//
//   protected constructor(config: C) {
//     this.config = config
//     this.value = config.defaultValue
//   }
//
//   abstract getValue: () => PortValueFromConfig<C>
//   abstract setValue: (value: PortValueFromConfig<C>) => void
//   abstract validate: () => Promise<boolean>
//   abstract reset: () => void
//   abstract hasValue: () => boolean
//   abstract clone: () => IPort<C>
// }
