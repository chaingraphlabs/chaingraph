import type { IPortConfig } from '../base/types' // adjust path as needed

// Utility type to recursively unwrap port values.
export type UnwrapPortValue<T> =
  T extends { value: infer V } ? UnwrapPortValue<V> :
    T extends Array<infer U> ? Array<UnwrapPortValue<U>> :
      T extends object ? { [K in keyof T]: UnwrapPortValue<T[K]> } :
        T

// Simple recursive unwrap function.
export function unwrapPortValue<T>(portValue: T): UnwrapPortValue<T> {
  if (portValue && typeof portValue === 'object') {
    if ('value' in portValue) {
      return unwrapPortValue((portValue as any).value)
    }
    if (Array.isArray(portValue)) {
      return portValue.map(item => unwrapPortValue(item)) as any
    }
    const res: any = {}
    for (const key in portValue) {
      if (Object.prototype.hasOwnProperty.call(portValue, key)) {
        res[key] = unwrapPortValue((portValue as any)[key])
      }
    }
    return res
  }
  return portValue as UnwrapPortValue<T>
}

// -----------------------------------------------------------------------------
// Wrapping helper functions (unchanged from previous refactor)

export function wrapPlainValueWithConfig(plain: any, cfg?: IPortConfig): any {
  if (cfg) {
    switch (cfg.type) {
      case 'object':
        return { type: 'object', value: wrapPlainObjectWithConfig(plain, cfg) }
      case 'array':
        return Array.isArray(plain)
          ? { type: 'array', value: wrapPlainArrayWithConfig(plain, cfg) }
          : { value: plain }
      default:
        return { type: cfg.type, value: plain }
    }
  } else {
    if (Array.isArray(plain))
      return { type: 'array', value: plain.map(item => wrapPlainValueWithConfig(item)) }
    else if (plain && typeof plain === 'object')
      return { type: 'object', value: wrapPlainObjectWithConfig(plain, undefined) }
    else return { value: plain }
  }
}

export function wrapPlainObjectWithConfig(obj: any, cfg?: IPortConfig): any {
  const result: any = {}
  if (cfg && cfg.type === 'object' && (cfg as any).schema && (cfg as any).schema.properties) {
    validatePlainObjectAgainstConfig(obj, cfg)
    const propConfigs = (cfg as any).schema.properties
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const propCfg = propConfigs[key]
        result[key] = wrapPlainValueWithConfig(obj[key], propCfg)
      }
    }
  } else {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = wrapPlainValueWithConfig(obj[key], undefined)
      }
    }
  }
  return result
}

export function wrapPlainArrayWithConfig(arr: any[], cfg: IPortConfig): any[] {
  const itemCfg = (cfg as any).itemConfig || undefined
  return arr.map(item => wrapPlainValueWithConfig(item, itemCfg))
}

// -----------------------------------------------------------------------------
// Helper to validate plain objects against config.
function validatePlainObjectAgainstConfig(plain: any, cfg: IPortConfig): void {
  if (cfg.type !== 'object')
    return
  const expectedProps = (cfg as any).schema?.properties || {}
  for (const key in plain) {
    if (Object.prototype.hasOwnProperty.call(plain, key) && !(key in expectedProps)) {
      throw new Error(
        `Unexpected field "${key}" for type "${cfg.type}". Expected keys: ${Object.keys(expectedProps).join(', ')}`,
      )
    }
  }
}

// -----------------------------------------------------------------------------
// Proxy Trap Generators

function createObjectTrap(cfg: IPortConfig) {
  return {
    get(target: any, prop: any, receiver: any) {
      if (prop === '_raw')
        return target
      const inner = target.value
      let childCfg: IPortConfig | undefined
      if (cfg.type === 'object' && (cfg as any).schema && (cfg as any).schema.properties) {
        childCfg = (cfg as any).schema.properties[prop as string]
      } else if (cfg.type === 'array') {
        childCfg = (cfg as any).itemConfig
      }
      // if (!childCfg) {
      //   throw new Error(`Invalid child config for property "${prop}"`)
      // }

      const result = inner[prop]
      if (!childCfg) {
        return result
      }

      return createMutableProxyWithConfig(result, childCfg)
    },
    set(target: any, prop: any, newValue: any, receiver: any) {
      let childCfg: IPortConfig | undefined
      if (cfg.type === 'object' && (cfg as any).schema && (cfg as any).schema.properties) {
        childCfg = (cfg as any).schema.properties[prop as string]
      } else if (cfg.type === 'array') {
        childCfg = (cfg as any).itemConfig
      }
      if (
        target.value
        && Object.prototype.hasOwnProperty.call(target.value, prop)
        && childCfg
        && childCfg.type === 'object'
        && newValue && typeof newValue === 'object'
        && !Array.isArray(newValue)
      ) {
        // Validate newValue and merge
        validatePlainObjectAgainstConfig(newValue, childCfg)
        const currentField = target.value[prop]
        if (currentField && currentField.value && typeof currentField.value === 'object') {
          for (const key in newValue) {
            if (Object.prototype.hasOwnProperty.call(newValue, key)) {
              let fieldCfg: IPortConfig | undefined
              if (childCfg && childCfg.type === 'object' && (childCfg as any).schema && (childCfg as any).schema.properties) {
                fieldCfg = (childCfg as any).schema.properties[key]
              }
              currentField.value[key] = wrapPlainValueWithConfig(newValue[key], fieldCfg)
            }
          }
          return true
        } else {
          // If current field is not mergeable, replace it entirely.
          target.value[prop] = wrapPlainValueWithConfig(newValue, childCfg)
          return true
        }
      } else {
        target.value[prop] = wrapPlainValueWithConfig(newValue, childCfg)
        return true
      }
    },
  }
}

function createArrayTrap(cfg: IPortConfig) {
  return {
    get(target: any, prop: any, receiver: any) {
      // Special handling for push – when "push" is requested, return a custom function.
      if (prop === 'push') {
        return function (...args: any[]) {
          // Wrap each new element using the config's item config.
          const itemCfg = (cfg as any).itemConfig || undefined
          const wrappedArgs = args.map(arg => wrapPlainValueWithConfig(arg, itemCfg))
          // Directly call the original push on the target array.
          return Array.prototype.push.apply(target, wrappedArgs)
        }
      }
      // For "length", or numeric indices, just forward to Reflect.
      const val = Reflect.get(target, prop, receiver)
      return createMutableProxyWithConfig(val, cfg)
    },
    set(target: any, prop: any, newValue: any, receiver: any) {
      // Allow length to be set normally.
      if (prop === 'length') {
        return Reflect.set(target, prop, newValue, receiver)
      }
      if (typeof prop === 'string' && !Number.isNaN(Number(prop))) {
        const current = Reflect.get(target, prop, receiver)
        if (
          current
          && typeof current === 'object'
          && 'value' in current
          && newValue && typeof newValue === 'object'
          && !Array.isArray(newValue)
        ) {
          target[Number(prop)] = wrapPlainValueWithConfig(newValue, cfg)
          return true
        } else {
          target[Number(prop)] = newValue
          return true
        }
      }
      return Reflect.set(target, prop, newValue, receiver)
    },
  }
}

// -----------------------------------------------------------------------------
// Main function: Create mutable proxy with config.
export function createMutableProxyWithConfig(portVal: any, cfg: IPortConfig): any {
  if (typeof portVal !== 'object' || portVal === null)
    return portVal
  if ('value' in portVal && typeof portVal.value !== 'undefined') {
    return new Proxy(portVal, createObjectTrap(cfg))
  }
  if (Array.isArray(portVal)) {
    return new Proxy(portVal, createArrayTrap(cfg))
  }
  return new Proxy(portVal, {
    get(target, prop, receiver) {
      const val = Reflect.get(target, prop, receiver)
      return createMutableProxyWithConfig(val, cfg)
    },
    set(target, prop, newValue, receiver) {
      target[prop] = newValue
      return true
    },
  })
}

// -----------------------------------------------------------------------------
// Entry point: Returns mutable unwrapped proxy with config.
export function mutableUnwrapPortValueWithConfig<T>(portValue: T, cfg: IPortConfig): UnwrapPortValue<T> {
  return createMutableProxyWithConfig(portValue, cfg)
}
