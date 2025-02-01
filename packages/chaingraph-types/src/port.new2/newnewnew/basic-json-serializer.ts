import type { EnsureJSONSerializable, JSONValue } from './json'
import { JSONValueSchema } from './json'

/**
 * Converts an input (which is either already a JSONValue or implements JSONSerializable)
 * to a JSONValue. If it is not a primitive object, then we assume it has a "serialize" method.
 */
export function serialize<T>(data: EnsureJSONSerializable<T>): JSONValue {
  // A simple runtime test: if data is a primitive, array or plain object, assume it is already JSONValue.
  if (
    typeof data === 'string'
    || typeof data === 'number'
    || typeof data === 'boolean'
    || data === null
    || Array.isArray(data)
    || (typeof data === 'object' && data.constructor === Object)
  ) {
    return data as JSONValue
  }
  // Otherwise, assume it's JSONSerializable and call its serialize method.
  if (typeof data === 'object' && data !== null && 'serialize' in data && typeof data.serialize === 'function') {
    return data.serialize()
  }
  throw new Error('Data is not JSONSerializable')
}

/**
 * Converts a JSONValue to a string.
 */
export function stringify(json: JSONValue): string {
  return JSON.stringify(json)
}

/**
 * Parses a JSON string into a JSONValue.
 * Validates the parsed value using JSONValueSchema.
 */
export function parseJson(jsonString: string): JSONValue {
  const parsed = JSON.parse(jsonString)
  return JSONValueSchema.parse(parsed)
}

/**
 * Given a JSONValue and a factory object that implements a 'deserialize' method,
 * returns the corresponding EnsureJSONSerializable<T>.
 * The factory can be an object or a class that has:
 *   deserialize: (json: JSONValue) => T
 */
export function deserialize<T>(json: JSONValue, factory: { deserialize: (json: JSONValue) => T }): EnsureJSONSerializable<T> {
  return factory.deserialize(json) as EnsureJSONSerializable<T>
}
