import type { PortUnion } from './port-full'
import type { PortValue } from './port-value-types'
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
export type UnwrapPortValue<T extends PortValue> =
  T extends { type: PortTypeEnum.String, value: infer V } ? V :
    T extends { type: PortTypeEnum.Number, value: infer V } ? V :
      T extends { type: PortTypeEnum.Boolean, value: infer V } ? V :
        T extends { type: PortTypeEnum.Enum, value: infer V } ? V :
          T extends { type: PortTypeEnum.Array, value: Array<infer U> } ? Array<UnwrapPortValue<U & PortValue>> :
            T extends { type: PortTypeEnum.Object, value: infer O } ? { [K in keyof O]: UnwrapPortValue<O[K] & PortValue> } :
              T extends { type: PortTypeEnum.Stream, value: infer V } ? V :
                never

/**
 * UnwrappedPort takes a full port P (which must have a "value" field)
 * and returns its unwrapped (plain) value type.
 */
export type UnwrappedPort<P extends PortUnion> =
  P extends { value: infer V } ? UnwrapPortValue<V & PortValue> : never

interface PortValueWithType {
  type: PortTypeEnum
  value: unknown
}

/**
 * Helper: Wraps a plain object value using the "expected" wrapper.
 */
function wrapObject(expected: PortValueWithType, newObj: Record<string, unknown>): PortValue {
  const wrapped: Record<string, unknown> = {}
  const expectedValue = expected.value as Record<string, PortValueWithType>

  for (const key in newObj) {
    if (
      expected.type === PortTypeEnum.Object
      && key in expectedValue
      && typeof expectedValue[key] === 'object'
      && expectedValue[key]
      && 'type' in expectedValue[key]
    ) {
      const expectedField = expectedValue[key] as PortValueWithType
      if (expectedField.type === PortTypeEnum.Object && typeof newObj[key] === 'object') {
        wrapped[key] = wrapObject(expectedField, newObj[key] as Record<string, unknown>)
      } else if (expectedField.type === PortTypeEnum.Array && Array.isArray(newObj[key])) {
        wrapped[key] = {
          type: PortTypeEnum.Array,
          value: (newObj[key] as unknown[]).map(el => createMutableProxy(el as PortValue)),
        }
      } else {
        wrapped[key] = { type: expectedField.type, value: newObj[key] }
      }
    } else {
      wrapped[key] = newObj[key]
    }
  }
  return { type: expected.type, value: wrapped } as PortValue
}

/**
 * A helper function that recursively unwraps a port value.
 */
export function unwrapValue<P extends PortUnion>(port: P): UnwrappedPort<P> {
  const validatedPort = validatePort(port)

  function unwrap(obj: PortValue): unknown {
    if (obj && typeof obj === 'object' && 'type' in obj && 'value' in obj) {
      if (obj.type === PortTypeEnum.Array) {
        return (obj.value as unknown[]).map(item => unwrap(item as PortValue))
      }
      if (obj.type === PortTypeEnum.Object) {
        const result: Record<string, unknown> = {}
        const value = obj.value as Record<string, PortValue>
        for (const key in value) {
          result[key] = unwrap(value[key])
        }
        return result
      }

      return obj.value
    }
    return obj
  }

  return unwrap(validatedPort.value as PortValue) as UnwrappedPort<P>
}

/**
 * Creates a mutable proxy for a port value.
 */
function createMutableProxy<T extends PortValue>(obj: T): UnwrapPortValue<T> {
  if (!obj || typeof obj !== 'object' || !('type' in obj) || !('value' in obj)) {
    return obj as UnwrapPortValue<T>
  }

  if (
    obj.type === PortTypeEnum.String
    || obj.type === PortTypeEnum.Number
    || obj.type === PortTypeEnum.Boolean
    || obj.type === PortTypeEnum.Enum
  ) {
    return obj.value as UnwrapPortValue<T>
  }

  if (obj.type === PortTypeEnum.Array) {
    const value = obj.value as unknown[]
    const fallbackType = value.length > 0 && typeof value[0] === 'object' && value[0] && 'type' in value[0]
      ? (value[0] as PortValueWithType).type
      : undefined

    return new Proxy(value, {
      get(target, prop, receiver) {
        if (prop === 'push') {
          return function (...args: unknown[]) {
            const wrappedArgs = args.map((arg) => {
              const expectedType = target.length > 0
                && typeof target[0] === 'object'
                && target[0]
                && 'type' in target[0]
                ? (target[0] as PortValueWithType).type
                : fallbackType
              return expectedType ? { type: expectedType, value: arg } : arg
            })
            return Reflect.apply(target.push, target, wrappedArgs)
          }
        }
        if (prop === 'unshift') {
          return function (...args: unknown[]) {
            const wrappedArgs = args.map((arg) => {
              const expectedType = target.length > 0
                && typeof target[0] === 'object'
                && target[0]
                && 'type' in target[0]
                ? (target[0] as PortValueWithType).type
                : fallbackType
              return expectedType ? { type: expectedType, value: arg } : arg
            })
            return Reflect.apply(target.unshift, target, wrappedArgs)
          }
        }
        if (prop === 'pop') {
          return function () {
            const popped = Reflect.apply(target.pop, target, [])
            return createMutableProxy(popped as PortValue)
          }
        }
        if (prop === 'shift') {
          return function () {
            const shifted = Reflect.apply(target.shift, target, [])
            return createMutableProxy(shifted as PortValue)
          }
        }
        const val = Reflect.get(target, prop, receiver)
        return createMutableProxy(val as PortValue)
      },
      set(target, prop, newVal, receiver) {
        if (typeof prop === 'string' && /^\d+$/.test(prop)) {
          const index = Number(prop)
          const current = target[index]
          let expectedType: PortTypeEnum | undefined

          if (current && typeof current === 'object' && 'type' in current) {
            expectedType = (current as PortValueWithType).type
          }

          let wrapped
          if (expectedType) {
            if (expectedType === PortTypeEnum.Array && Array.isArray(newVal)) {
              wrapped = {
                type: expectedType,
                value: (newVal as unknown[]).map(el => createMutableProxy(el as PortValue)),
              }
            } else if (expectedType === PortTypeEnum.Object && typeof newVal === 'object') {
              wrapped = wrapObject(
                { type: expectedType, value: current } as PortValueWithType,
                newVal as Record<string, unknown>,
              )
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
    }) as UnwrapPortValue<T>
  }

  if (obj.type === PortTypeEnum.Object) {
    const value = obj.value as Record<string, PortValue>
    return new Proxy(value, {
      get(target, prop, receiver) {
        const val = Reflect.get(target, prop, receiver)
        return createMutableProxy(val as PortValue)
      },
      set(target, prop, newVal, receiver) {
        if (typeof prop === 'string') {
          const current = target[prop]
          if (current && typeof current === 'object' && 'type' in current) {
            const expectedType = (current as PortValueWithType).type
            if (expectedType === PortTypeEnum.Object && typeof newVal === 'object') {
              return Reflect.set(
                target,
                prop,
                wrapObject(current as PortValueWithType, newVal as Record<string, unknown>),
                receiver,
              )
            } else if (expectedType === PortTypeEnum.Array && Array.isArray(newVal)) {
              return Reflect.set(
                target,
                prop,
                {
                  type: expectedType,
                  value: (newVal as unknown[]).map(el => createMutableProxy(el as PortValue)),
                },
                receiver,
              )
            } else {
              return Reflect.set(target, prop, { type: expectedType, value: newVal }, receiver)
            }
          }
        }
        return Reflect.set(target, prop, newVal, receiver)
      },
    }) as UnwrapPortValue<T>
  }

  return obj.value as UnwrapPortValue<T>
}

/**
 * unwrapMutableValue returns a recursively proxied version of the port's internal "value"
 * so that reading yields unwrapped values and writing sets underlying wrappers appropriately.
 */
export function unwrapMutableValue<P extends PortUnion>(port: P): UnwrappedPort<P> {
  FullPortSchema.parse(port)
  return createMutableProxy(port.value as PortValue) as UnwrappedPort<P>
}
