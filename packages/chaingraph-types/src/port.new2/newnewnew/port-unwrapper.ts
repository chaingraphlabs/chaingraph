import type { PortUnion } from './port-full'
import { PortTypeEnum } from './port-types.enum'
import { FullPortSchema } from './zod-full-port'

/**
 * Helper function to validate a port using Zod schema
 */
function validatePort<P extends PortUnion>(port: P): P {
  try {
    return FullPortSchema.parse(port) as P
  } catch (error) {
    throw new Error(`Invalid port structure: ${error}`)
  }
}

/**
 * UnwrapPortValue recursively strips the "wrapper" (i.e. the { type, value } construct)
 * from any port value. Scalars yield their inner type.
 *
 * For arrays, it maps over each element;
 * for objects, it maps over each key.
 */
export type UnwrapPortValue<T> =
  T extends { type: PortTypeEnum.String, value: infer V } ? V :
    T extends { type: PortTypeEnum.Number, value: infer V } ? V :
      T extends { type: PortTypeEnum.Boolean, value: infer V } ? V :
        T extends { type: PortTypeEnum.Enum, value: infer V } ? V :
          T extends { type: PortTypeEnum.Array, value: Array<infer U> } ? Array<UnwrapPortValue<U>> :
            T extends { type: PortTypeEnum.Object, value: infer O } ? { [K in keyof O]: UnwrapPortValue<O[K]> } :
              never

/**
 * UnwrappedPort takes a full port P (which must have a "value" field)
 * and returns its unwrapped (plain) value type.
 */
export type UnwrappedPort<P> =
  P extends { value: infer V } ? UnwrapPortValue<V> : never

/**
 * Helper: Wraps a plain object value using the "expected" wrapper.
 * 'expected' is the original object wrapper, for example:
 * { type: 'object', value: { color: { type: 'string', value: 'red' } } }
 * Then wrapObject(expected, { color: 'green' }) returns:
 * { type: 'object', value: { color: { type: 'string', value: 'green' } } }
 */
function wrapObject(expected: any, newObj: any): any {
  const wrapped: any = {}
  // Iterate through every key in the new plain object
  for (const key in newObj) {
    // If the expected wrapper has a known shape for this key, use it.
    if (
      expected.value
      && key in expected.value
      && typeof expected.value[key] === 'object'
      && expected.value[key] !== null
      && 'type' in expected.value[key]
    ) {
      const expectedField = expected.value[key]
      // If expected field is an object, recursively rewrap.
      if (expectedField.type === PortTypeEnum.Object && typeof newObj[key] === 'object') {
        wrapped[key] = wrapObject(expectedField, newObj[key])
      } else if (expectedField.type === PortTypeEnum.Array && Array.isArray(newObj[key])) {
        // If expected field is an array and newObj[key] is an array, rewrap each element.
        wrapped[key] = {
          type: PortTypeEnum.Array,
          value: newObj[key].map((el: any) => createMutableProxy(el)),
        }
      } else {
        wrapped[key] = { type: expectedField.type, value: newObj[key] }
      }
    } else {
      // No expected shape: just copy the new value directly.
      wrapped[key] = newObj[key]
    }
  }
  return { type: expected.type, value: wrapped }
}

/**
 * A helper function that recursively unwraps a port value.
 * Validates the port structure using Zod before unwrapping.
 */
export function unwrapValue<P extends PortUnion>(port: P): UnwrappedPort<P> {
  // Validate port structure before unwrapping
  const validatedPort = validatePort(port)
  function unwrap<T>(obj: any): any {
    if (obj && typeof obj === 'object' && 'type' in obj && 'value' in obj) {
      if (obj.type === PortTypeEnum.Array) {
        return (obj.value as any[]).map(unwrap)
      }
      if (obj.type === PortTypeEnum.Object) {
        const result: any = {}
        for (const key in obj.value) {
          result[key] = unwrap(obj.value[key])
        }
        return result
      }
      return obj.value
    }
    return obj
  }
  return unwrap((validatedPort as any).value)
}

/**
 * Recursively unwraps a port value with mutable access.
 * For scalars, returns the inner value.
 * For arrays and objects, returns a Proxy that intercepts gets and sets.
 * Validates the port structure using Zod before unwrapping.
 */
function createMutableProxy<T>(obj: any): T {
  if (!obj || typeof obj !== 'object' || !('type' in obj) || !('value' in obj))
    return obj
  if (
    obj.type === PortTypeEnum.String
    || obj.type === PortTypeEnum.Number
    || obj.type === PortTypeEnum.Boolean
    || obj.type === PortTypeEnum.Enum
  ) {
    return obj.value
  }
  if (obj.type === PortTypeEnum.Array) {
    // Determine fallback expected type (if array not empty, use first element)
    const fallbackType: PortTypeEnum | undefined
      = (obj.value.length > 0 && typeof obj.value[0] === 'object' && 'type' in obj.value[0])
        ? obj.value[0].type
        : undefined
    return new Proxy(obj.value, {
      get(target, prop, receiver) {
        if (prop === 'push') {
          return function (...args: any[]) {
            const wrappedArgs = args.map((arg) => {
              const expectedType = (target.length > 0
                && typeof target[0] === 'object'
                && 'type' in target[0])
                ? target[0].type
                : fallbackType
              return expectedType !== undefined ? { type: expectedType, value: arg } : arg
            })
            return Reflect.apply(target.push, target, wrappedArgs)
          }
        }
        if (prop === 'unshift') {
          return function (...args: any[]) {
            const wrappedArgs = args.map((arg) => {
              const expectedType = (target.length > 0
                && typeof target[0] === 'object'
                && 'type' in target[0])
                ? target[0].type
                : fallbackType
              return expectedType !== undefined ? { type: expectedType, value: arg } : arg
            })
            return Reflect.apply(target.unshift, target, wrappedArgs)
          }
        }
        if (prop === 'pop') {
          return function () {
            const popped = Reflect.apply(target.pop, target, [])
            return createMutableProxy(popped)
          }
        }
        if (prop === 'shift') {
          return function () {
            const shifted = Reflect.apply(target.shift, target, [])
            return createMutableProxy(shifted)
          }
        }
        const val = Reflect.get(target, prop, receiver)
        return createMutableProxy(val)
      },
      set(target, prop, newVal, receiver) {
        if (typeof prop === 'string' && /^\d+$/.test(prop)) {
          const index = Number(prop)
          let expectedType: PortTypeEnum | undefined
          if (target.length > index && typeof target[index] === 'object' && 'type' in target[index]) {
            expectedType = target[index].type
          }
          let wrapped
          if (expectedType !== undefined) {
            if (expectedType === PortTypeEnum.Array && Array.isArray(newVal)) {
              wrapped = { type: expectedType, value: newVal.map((el: any) => createMutableProxy(el)) }
            } else if (expectedType === PortTypeEnum.Object && typeof newVal === 'object') {
              wrapped = wrapObject(target[index], newVal)
            } else {
              wrapped = { type: expectedType, value: newVal }
            }
          } else {
            wrapped = newVal
          }
          return Reflect.set(target, prop, wrapped, receiver)
        }
        return Reflect.set(target, prop, newVal, receiver)
      },
    })
  }
  if (obj.type === PortTypeEnum.Object) {
    return new Proxy(obj.value, {
      get(target, prop, receiver) {
        const val = Reflect.get(target, prop, receiver)
        return createMutableProxy(val)
      },
      set(target, prop, newVal, receiver) {
        const current = target[prop]
        if (current && typeof current === 'object' && 'type' in current) {
          const expectedType = current.type
          if (expectedType === PortTypeEnum.Object && typeof newVal === 'object') {
            return Reflect.set(target, prop, wrapObject(current, newVal), receiver)
          } else if (expectedType === PortTypeEnum.Array && Array.isArray(newVal)) {
            return Reflect.set(
              target,
              prop,
              { type: expectedType, value: newVal.map((el: any) => createMutableProxy(el)) },
              receiver,
            )
          } else {
            return Reflect.set(target, prop, { type: expectedType, value: newVal }, receiver)
          }
        }
        return Reflect.set(target, prop, newVal, receiver)
      },
    })
  }
  return obj.value
}

/**
 * unwrapMutableValue returns a recursively proxied version of the port's internal "value"
 * so that reading yields unwrapped values and writing sets underlying wrappers appropriately.
 * Validates the port structure using Zod before unwrapping.
 *
 * IMPORTANT: To ensure that mutations update the original port object, we now validate
 * the port without replacing its reference and then use the original port.value.
 */
export function unwrapMutableValue<P extends PortUnion>(port: P): UnwrappedPort<P> {
  // Validate port structure (throws if invalid) but DO NOT use the returned copy.
  FullPortSchema.parse(port)
  // Use the original port.value so that mutations update the original object.
  return createMutableProxy(port.value)
}
