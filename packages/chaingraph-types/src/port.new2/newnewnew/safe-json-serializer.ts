import type { JSONPrimitive, JSONSerializable, JSONValue } from './json'
import { z } from 'zod'
import { JSONValueSchema } from './json'

/**
 * Type guard: Checks if an object implements JSONSerializable.
 */
function isJSONSerializable(obj: any): obj is JSONSerializable<any> {
  return typeof obj?.serialize === 'function'
}

/**
 * Recursively converts any input into a JSONValue.
 * - If the input is a JSON primitive, returns it as is.
 * - If it’s an array, recursively transforms each element.
 * - If it implements JSONSerializable, calls its serialize() method, then recurses.
 * - If it is a plain object, recurses into each property.
 * - Otherwise, throws an error.
 */
export function recursiveSerialize(input: unknown): JSONValue {
  if (
    typeof input === 'string'
    || typeof input === 'number'
    || typeof input === 'boolean'
    || input === null
  ) {
    return input as JSONPrimitive
  }
  if (Array.isArray(input)) {
    return input.map(item => recursiveSerialize(item)) as JSONValue
  }
  if (typeof input === 'object' && input !== null) {
    if (isJSONSerializable(input)) {
      const serialized = input.serialize()
      return recursiveSerialize(serialized)
    }
    if (input.constructor === Object) {
      const result: Record<string, JSONValue> = {}
      for (const key in input) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
          result[key] = recursiveSerialize((input as Record<string, unknown>)[key])
        }
      }
      return result as JSONValue
    }
    throw new Error(`Object of type ${input.constructor.name} is not JSON-serializable`)
  }
  throw new Error(`Unable to serialize input to JSONValue: ${input}`)
}

/**
 * A Zod schema that preprocesses input by recursively serializing it.
 * We use z.preprocess to transform input before validating it as a JSONValue.
 *
 * Note: Due to how z.preprocess works, the resulting type becomes a ZodEffects.
 * If TypeScript complains (TS2322), you may cast the entire expression to z.ZodType<JSONValue>.
 */
export const safeJSONValueSchema: z.ZodType<JSONValue> = z.preprocess(
  input => recursiveSerialize(input),
  JSONValueSchema,
) as z.ZodType<JSONValue>
