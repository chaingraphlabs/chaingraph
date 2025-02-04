import type { IPortConfig } from '../base/types' // adjust the path as needed

// Recursive utility type to unwrap a port value.
export type UnwrapPortValue<T> =
  T extends { value: infer V } ? UnwrapPortValue<V> :
    T extends Array<infer U> ? Array<UnwrapPortValue<U>> :
      T extends object ? { [K in keyof T]: UnwrapPortValue<T[K]> } :
        T

// A simple unwrap function (unchanged).
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

/*
  Helper functions to wrap a new plain value (or structure) using configuration info.
  This preserves type information from the config.
*/

// Updated wrapPlainValueWithConfig:
// If a configuration is provided, then if its type is "object" or "array" we call the respective helper,
// else (for scalars) we return a wrapper with { type: cfg.type, value: plain }.
function wrapPlainValueWithConfig(plain: any, cfg?: IPortConfig): any {
  if (cfg) {
    if (cfg.type === 'object') {
      return { type: 'object', value: wrapPlainObjectWithConfig(plain, cfg) }
    } else if (cfg.type === 'array' && Array.isArray(plain)) {
      return { type: 'array', value: wrapPlainArrayWithConfig(plain, cfg) }
    } else {
      // For scalar types such as "string", "number", "boolean", "enum", etc.,
      // wrap with the provided type.
      return { type: cfg.type, value: plain }
    }
  } else {
    // Autodetect if no config is provided.
    if (Array.isArray(plain)) {
      return { type: 'array', value: plain.map(item => wrapPlainValueWithConfig(item)) }
    } else if (plain && typeof plain === 'object') {
      return { type: 'object', value: wrapPlainObjectWithConfig(plain, undefined) }
    } else {
      return { value: plain }
    }
  }
}

function wrapPlainObjectWithConfig(obj: any, cfg?: IPortConfig): any {
  const result: any = {}
  // If the config has a schema and properties, use each field's config.
  if (cfg && cfg.type === 'object' && (cfg as any).schema && (cfg as any).schema.properties) {
    const propConfigs = (cfg as any).schema.properties
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const propCfg = propConfigs[key] // might be undefined
        result[key] = wrapPlainValueWithConfig(obj[key], propCfg)
      }
    }
  } else {
    // Otherwise auto-wrap fields without additional type info.
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = wrapPlainValueWithConfig(obj[key], undefined)
      }
    }
  }
  return result
}

function wrapPlainArrayWithConfig(arr: any[], cfg: IPortConfig): any[] {
  // Use cfg.itemConfig if available.
  const itemCfg = (cfg as any).itemConfig || undefined
  return arr.map(item => wrapPlainValueWithConfig(item, itemCfg))
}

/**
 * Creates a mutable proxy for the original port value structure using config.
 * The proxy intercepts property writes so that when an entire object or array is
 * replaced, the new plain values are re‐wrapped using the provided config.
 *
 * IMPORTANT: Pass in the original port value structure (with the wrappers)
 * and the corresponding configuration.
 */
export function createMutableProxyWithConfig(portVal: any, cfg: IPortConfig): any {
  if (typeof portVal !== 'object' || portVal === null) {
    return portVal
  }

  // Branch for port wrappers (objects that have a "value" field)
  if ('value' in portVal && typeof portVal.value !== 'undefined') {
    return new Proxy(portVal, {
      get(target, prop, receiver) {
        if (prop === '_raw')
          return target
        const inner = target.value
        let childCfg: IPortConfig | undefined
        if (cfg.type === 'object' && (cfg as any).schema && (cfg as any).schema.properties) {
          childCfg = (cfg as any).schema.properties[prop as string]
        } else if (cfg.type === 'array') {
          childCfg = (cfg as any).itemConfig
        }
        const result = inner[prop]
        return createMutableProxyWithConfig(result, childCfg || { type: 'any', value: undefined })
      },
      set(target, prop, newValue, receiver) {
        let childCfg: IPortConfig | undefined
        if (cfg.type === 'object' && (cfg as any).schema && (cfg as any).schema.properties) {
          childCfg = (cfg as any).schema.properties[prop as string]
        } else if (cfg.type === 'array') {
          childCfg = (cfg as any).itemConfig
        }
        if (target.value && Object.prototype.hasOwnProperty.call(target.value, prop)) {
          const currentField = target.value[prop]
          // If current field is a port wrapper of type "object" and newValue is a plain object,
          // then merge its keys, using the proper wrapping by child config.
          if (
            currentField
            && typeof currentField === 'object'
            && 'value' in currentField
            && currentField.type === 'object'
            && newValue
            && typeof newValue === 'object'
            && !Array.isArray(newValue)
          ) {
            for (const key in newValue) {
              if (newValue.hasOwnProperty(key)) {
                let fieldCfg: IPortConfig | undefined
                if (childCfg && childCfg.type === 'object' && (childCfg as any).schema && (childCfg as any).schema.properties) {
                  fieldCfg = ((childCfg as any).schema.properties)[key]
                }
                currentField.value[key] = wrapPlainValueWithConfig(newValue[key], fieldCfg)
              }
            }
            return true
          }
          // If current field is a port wrapper of type "array" and newValue is an array,
          // then completely replace the inner array by re-wrapping it.
          else if (
            currentField
            && typeof currentField === 'object'
            && 'value' in currentField
            && currentField.type === 'array'
            && Array.isArray(newValue)
          ) {
            target.value[prop] = wrapPlainValueWithConfig(newValue, childCfg)
            return true
          } else {
            // Otherwise, update the inner value, wrapping it with type info if available.
            currentField.value = (childCfg ? wrapPlainValueWithConfig(newValue, childCfg) : newValue).value
            // Notice that we take .value from the newly wrapped object to preserve the inner structure.
            return true
          }
        }
        // If the property does not exist, add it.
        target.value[prop] = wrapPlainValueWithConfig(newValue, childCfg)
        return true
      },
    })
  }

  // Branch for arrays (if not already handled above)
  if (Array.isArray(portVal)) {
    return new Proxy(portVal, {
      get(target, prop, receiver) {
        const val = Reflect.get(target, prop, receiver)
        return createMutableProxyWithConfig(val, cfg)
      },
      set(target, prop, newValue, receiver) {
        if (typeof prop === 'string' && !isNaN(Number(prop))) {
          const current = Reflect.get(target, prop, receiver)
          if (
            current
            && typeof current === 'object'
            && 'value' in current
            && newValue
            && typeof newValue === 'object'
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
    })
  }

  // Fallback: Proxy for plain objects.
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

/**
 * Returns a mutable unwrapped proxy for the given port value using the provided config.
 * IMPORTANT: Pass in the original port value (with wrappers) and its corresponding config.
 */
export function mutableUnwrapPortValueWithConfig<T>(portValue: T, cfg: IPortConfig): UnwrapPortValue<T> {
  return createMutableProxyWithConfig(portValue, cfg)
}
