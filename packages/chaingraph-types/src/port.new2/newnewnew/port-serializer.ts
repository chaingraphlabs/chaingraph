import type { ZodType } from 'zod'
import type { EnsureJSONSerializable } from './json'
import type { InferredFullPort } from './port-full'
import { parseJson, stringify } from './basic-json-serializer'
import { recursiveSerialize } from './safe-json-serializer'
import { FullPortSchema } from './zod-full-port'

/**
 * Serializes a port to a JSONValue.
 * First, validates the port against FullPortSchema, then applies recursiveSerialize.
 *
 * @param port - A port object conforming to the InferredFullPort type.
 * @returns A JSONValue representing the port.
 */
export function serializePortToJSONValue(port: InferredFullPort): EnsureJSONSerializable<InferredFullPort> {
  const validated = FullPortSchema.parse(port)
  return recursiveSerialize(validated) as EnsureJSONSerializable<InferredFullPort>
}

/**
 * Serializes a port to a JSON string.
 * (Uses serializePortToJSONValue then stringifies the result.)
 *
 * @param port - A port object conforming to the InferredFullPort type.
 * @returns A string containing the JSON representation.
 */
export function serializePortToString(port: InferredFullPort): string {
  const jsonValue = serializePortToJSONValue(port)
  return stringify(jsonValue)
}

/**
 * Deserializes a JSON string into a port.
 * Parses the string into a JSONValue then validates with FullPortSchema.
 *
 * @param json - A JSON string representing a port.
 * @returns A port object of type InferredFullPort.
 */
export function deserializePortFromString(json: string): InferredFullPort {
  const jsonValue = parseJson(json)
  return FullPortSchema.parse(jsonValue)
}

/**
 * Generic deserialization that allows restoring a specific port type.
 *
 * @param json - The JSON string representing a port.
 * @param schema - Optional Zod schema that defines the expected port type.
 * @returns A validated port object of the specified type.
 */
export function deserializePortAs<T extends InferredFullPort = InferredFullPort>(
  json: string,
  schema?: ZodType<T>,
): T {
  const jsonValue = parseJson(json)
  return (schema ?? FullPortSchema as ZodType<T>).parse(jsonValue)
}

// For backward compatibility
export const serializePort = serializePortToString
export const deserializePort = deserializePortFromString
