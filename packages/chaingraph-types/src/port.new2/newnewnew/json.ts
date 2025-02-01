import { z } from 'zod'

// JSON primitive type and schema
export const JSONPrimitiveSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
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

// JSONSerializable interface and its (optional) Zod schema.
// This lets us later validate any classes that implement a serialize/deserialize pair.
export interface JSONSerializable<T> {
  serialize: () => JSONValue
  deserialize: (value: JSONValue) => T
}

// The compile‑time guard: if T is JSONValue already, accept it; otherwise, require JSONSerializable.
export type EnsureJSONSerializable<T> =
  T extends JSONValue ? T :
    T extends JSONSerializable<any> ? T :
      never

// (Optional) Zod schema for a JSONSerializable object (only for documentation; functions are not validated at runtime).
export const JSONSerializableSchema = z.object({
  serialize: z.function().args().returns(JSONValueSchema),
  deserialize: z.function().args(JSONValueSchema).returns(z.any()),
})
