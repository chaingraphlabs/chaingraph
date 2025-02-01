import type { InferredFullPort } from './port-full'
import { FullPortSchema } from './zod-full-port'

/**
 * Serialize a port to a JSON string.
 * This function first validates the port object using the Zod schema,
 * then returns the stringified JSON.
 *
 * @param port - A port object conforming to the InferredFullPort type.
 * @returns JSON string representation of the port.
 */
export function serializePort(port: InferredFullPort): string {
  // Validate the port object using Zod
  const validated = FullPortSchema.parse(port)
  // Stringify the valid object to JSON
  return JSON.stringify(validated)
}

/**
 * Deserialize a JSON string to a port object.
 * This function parses the JSON string and then validates it using the Zod schema,
 * guaranteeing that the resulting object exactly matches the port type.
 *
 * @param json - A JSON string representing a port.
 * @returns A validated port object.
 * @throws An error if the JSON cannot be parsed or if it fails validation.
 */
export function deserializePort(json: string): InferredFullPort {
  // Parse JSON string to get a plain object
  const parsed = JSON.parse(json)
  // Validate and return the port object using Zod
  return FullPortSchema.parse(parsed)
}
