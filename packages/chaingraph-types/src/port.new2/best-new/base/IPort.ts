import type { JSONValue } from './json'
import type { ExtractValue, IPortConfig } from './types'

export interface IPort<C extends IPortConfig> {
  getConfig: () => C

  setConfig: (newConfig: C) => void

  getValue: () => ExtractValue<C> | undefined

  setValue: (newValue: ExtractValue<C>) => void

  reset: () => void

  serialize: () => JSONValue

  deserialize: (data: JSONValue) => IPort<C>

  validate: () => boolean
}

/**
 * Type guard to check if an object implements the IPort interface.
 * Useful for runtime type checking of port instances.
 *
 * @param obj - The object to check
 * @returns true if the object implements IPort with any valid config and value types
 */
export function isIPort(obj: unknown): obj is IPort<IPortConfig> {
  return (
    obj !== null
    && typeof obj === 'object'
    && 'getConfig' in obj
    && 'setConfig' in obj
    && 'getValue' in obj
    && 'setValue' in obj
    && 'reset' in obj
    && 'serialize' in obj
    && 'deserialize' in obj
    && 'validate' in obj
  )
}
