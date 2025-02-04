export type UnwrapPortValue<T> =
  T extends { value: infer V } ? UnwrapPortValue<V> :
    T extends Array<infer U> ? Array<UnwrapPortValue<U>> :
      T extends object ? { [K in keyof T]: UnwrapPortValue<T[K]> } :
        T

export function unwrapPortValue<T>(portValue: T): UnwrapPortValue<T> {
  if (portValue && typeof portValue === 'object') {
    if ('value' in portValue) {
      // recursively unwrap if object has "value"
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
   Helper functions to automatically wrap a plain value
   into a port‐wrapper that matches the type information
   of an existing (or inferred) wrapper.
*/

function wrapPlainValue(plain: any, existingWrapper?: any): any {
  // If we have existing type info, use it.
  if (existingWrapper && typeof existingWrapper === 'object' && 'type' in existingWrapper) {
    if (existingWrapper.type === 'array' && Array.isArray(plain)) {
      return { type: 'array', value: plain.map(item => wrapPlainItem(item)) }
    } else if (existingWrapper.type === 'object' && plain && typeof plain === 'object' && !Array.isArray(plain)) {
      return { type: 'object', value: wrapPlainObject(plain) }
    } else {
      return { value: plain }
    }
  } else {
    // attempt autodetection: if array then wrap as array, if object then as object
    if (Array.isArray(plain)) {
      return { type: 'array', value: plain.map(item => wrapPlainItem(item)) }
    } else if (plain && typeof plain === 'object') {
      return { type: 'object', value: wrapPlainObject(plain) }
    } else {
      return { value: plain }
    }
  }
}

function wrapPlainItem(item: any): any {
  if (item && typeof item === 'object' && !Array.isArray(item)) {
    return { type: 'object', value: wrapPlainObject(item) }
  }
  return { value: item }
}

function wrapPlainObject(obj: any): any {
  const result: any = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key] = wrapPlainValue(obj[key])
    }
  }
  return result
}

/**
 * Creates a mutable proxy for the original port value structure.
 * The proxy intercepts property writes so that assignments to
 * objects and arrays automatically “wrap” plain values into the necessary
 * structure – for example, preserving type:"object" or type:"array" wrappers.
 *
 * IMPORTANT: Pass in the original port value structure (the one containing { value: … } wrappers).
 */
export function createMutableProxy(portVal: any): any {
  // For primitive values, just return them.
  if (typeof portVal !== 'object' || portVal === null) {
    return portVal
  }

  // ----- Branch for port wrappers (an object with a "value" field)
  if ('value' in portVal && typeof portVal.value !== 'undefined') {
    return new Proxy(portVal, {
      get(target, prop, receiver) {
        // Shortcut: if caller asks for the raw underlying object, return it.
        if (prop === '_raw')
          return target
        const inner = target.value
        const result = inner[prop]
        return createMutableProxy(result)
      },
      set(target, prop, newValue, receiver) {
        // If property already exists on the inner "value" object, update it.
        if (target.value && Object.prototype.hasOwnProperty.call(target.value, prop)) {
          const currentField = target.value[prop]
          // If current field is a port wrapper of type "object" and newValue is a plain object,
          // then merge keys where possible.
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
                currentField.value[key] = wrapPlainValue(newValue[key], currentField.value[key])
              }
            }
            return true
          }
          // If current field is a port wrapper of type "array" and newValue is an array,
          // replace the entire inner array with a new wrapped array.
          else if (
            currentField
            && typeof currentField === 'object'
            && 'value' in currentField
            && currentField.type === 'array'
            && Array.isArray(newValue)
          ) {
            target.value[prop] = wrapPlainValue(newValue, currentField)
            return true
          } else {
            // For other cases, simply update the inner value.
            currentField.value = newValue
            return true
          }
        }
        // If property doesn't exist yet on target.value, add it using auto‐wrap.
        target.value[prop] = wrapPlainValue(newValue)
        return true
      },
    })
  }

  // ----- Branch for arrays – if not already wrapped via above branch.
  if (Array.isArray(portVal)) {
    return new Proxy(portVal, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver)
        return createMutableProxy(value)
      },
      set(target, prop, newValue, receiver) {
        // When replacing an element in the array:
        if (typeof prop === 'string' && !isNaN(Number(prop))) {
          const current = Reflect.get(target, prop, receiver)
          // If current element exists and is a port wrapper and newValue is an object,
          // update it accordingly.
          if (
            current
            && typeof current === 'object'
            && 'value' in current
            && newValue
            && typeof newValue === 'object'
            && !Array.isArray(newValue)
          ) {
            target[Number(prop)] = wrapPlainValue(newValue, current)
            return true
          } else {
            // Otherwise, replace the element.
            target[Number(prop)] = newValue
            return true
          }
        }
        return Reflect.set(target, prop, newValue, receiver)
      },
    })
  }

  // ----- Fallback – for plain objects, wrap recursively.
  return new Proxy(portVal, {
    get(target, prop, receiver) {
      const val = Reflect.get(target, prop, receiver)
      return createMutableProxy(val)
    },
    set(target, prop, newValue, receiver) {
      return Reflect.set(target, prop, newValue, receiver)
    },
  })
}

/**
 * Returns a mutable unwrapped proxy for the given port value.
 * IMPORTANT: Pass in the original port value (with its wrappers).
 */
export function mutableUnwrapPortValue<T>(portValue: T): UnwrapPortValue<T> {
  return createMutableProxy(portValue)
}
