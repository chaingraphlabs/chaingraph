import { z } from 'zod'

// JSON primitive type and schema
export const JSONPrimitiveSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.undefined(),
  z.unknown(),
])

// Zod schema for JSONValue (recursive)
export const JSONValueSchema: z.ZodType<JSONValue> = z.lazy(() =>
  z.union([
    JSONPrimitiveSchema,
    z.array(z.lazy(() => JSONValueSchema)),
    z.record(z.lazy(() => JSONValueSchema)),
  ]),
)

export type JSONPrimitive = z.infer<typeof JSONPrimitiveSchema>

// JSONValue is a recursive union of primitive, array, or object.
export type JSONValue = JSONPrimitive | JSONObject | JSONArray

export interface JSONObject {
  [key: string]: JSONValue
}

export type JSONArray = JSONValue[]

export type EnsureJSONSerializable<T> =
  T extends JSONValue ? T :
    never
