import type { ZodType } from 'zod'
import type { InferredFullPort } from './port-full'
import { FullPortSchema } from './zod-full-port'

/**
 * Serialize a port to a JSON string.
 * This function validates the port using FullPortSchema,
 * then returns the stringified JSON.
 *
 * @param port - A port object conforming to the InferredFullPort type.
 * @returns JSON string representation of the port.
 * @throws If validation fails or port structure is invalid.
 */
export function serializePort(port: InferredFullPort): string {
  // Validate the port object using Zod
  const validated = FullPortSchema.parse(port)
  // Stringify the valid object to JSON
  return JSON.stringify(validated)
}

/**
 * Deserialize a JSON string to a port object.
 * This function parses the JSON, then validates it using FullPortSchema.
 * It returns a port object of type InferredFullPort.
 *
 * @param json - A JSON string representing a port.
 * @returns A validated port object (full union type).
 * @throws If JSON parsing fails or validation fails.
 */
export function deserializePort(json: string): InferredFullPort {
  try {
    // Parse JSON string to get a plain object
    const parsed = JSON.parse(json)
    // Validate and return the port object using FullPortSchema
    return FullPortSchema.parse(parsed)
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new TypeError(`Invalid JSON format: ${error.message}`)
    }
    throw error
  }
}

/**
 * Generic deserialization function that allows restoring a specific port type.
 * If you have a Zod schema that narrows the type (e.g. to StringPort), pass it as the second argument.
 * Otherwise, it defaults to FullPortSchema.
 *
 * Usage examples:
 *   // Restore complete port union
 *   const restored1 = deserializePortAs(json)
 *
 *   // Restore as a StringPort type (when you have a custom schema for string ports)
 *   const restored2 = deserializePortAs<StringPort>(json, StringPortSchema)
 *
 * @param json - The JSON string representing a port.
 * @param schema - Optional Zod schema that defines the expected port type.
 * @returns A validated port object of the expected type.
 * @throws If JSON parsing fails, validation fails, or type constraints are not met.
 */
export function deserializePortAs<T extends InferredFullPort = InferredFullPort>(
  json: string,
  schema?: ZodType<T>,
): T {
  try {
    const parsed = JSON.parse(json)
    return (schema ?? FullPortSchema as ZodType<T>).parse(parsed)
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new TypeError(`Invalid JSON format: ${error.message}`)
    }
    throw error
  }
}
