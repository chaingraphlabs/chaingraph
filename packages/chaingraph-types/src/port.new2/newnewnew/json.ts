// JSON Basics: primitives, arrays, objects, and overall JSONValue.
export type JSONPrimitive = string | number | boolean | null
export type JSONArray = JSONValue[]
export interface JSONObject { [key: string]: JSONValue }
export type JSONValue = JSONPrimitive | JSONObject | JSONArray

// JSONSerializable contract: any type implementing serialization to/from JSON.
export interface JSONSerializable<T> {
  serialize: () => JSONValue
  deserialize: (value: JSONValue) => T
}

/*
  Compile-time guard: if T is already a JSONValue, accept it;
  otherwise, T must implement JSONSerializable.
*/
export type EnsureJSONSerializable<T> =
  T extends JSONValue ? T :
    T extends JSONSerializable<any> ? T :
      never
