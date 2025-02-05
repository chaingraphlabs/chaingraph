import type { IPortValue } from '@chaingraph/types/port-new/base/types'

export type UnwrapPortValue<T> =
  T extends { value: infer V } ? UnwrapPortValue<V> :
    T extends Array<infer U> ? Array<UnwrapPortValue<U>> :
      T extends object ? { [K in keyof T]: UnwrapPortValue<T[K]> } :
        T

export function unwrapPortValue<T extends IPortValue>(portValue: T): UnwrapPortValue<T> {
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
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = wrapPlainValue(obj[key])
    }
  }
  return result
}
