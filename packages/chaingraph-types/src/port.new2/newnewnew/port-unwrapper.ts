import { PortTypeEnum } from './port-types.enum'

/**
 * UnwrapPortValue recursively strips the "wrapper" (i.e. the { type, value } construct)
 * from any port value. Scalars yield their inner type.
 *
 * For arrays, it maps over each element;
 * for objects, it maps over each key.
 */
export type UnwrapPortValue<T> =
// Scalars and enum
  T extends { type: PortTypeEnum.String, value: infer V } ? V :
    T extends { type: PortTypeEnum.Number, value: infer V } ? V :
      T extends { type: PortTypeEnum.Boolean, value: infer V } ? V :
        T extends { type: PortTypeEnum.Enum, value: infer V } ? V :
          // Array: recursively unwrap each element of the array
          T extends { type: PortTypeEnum.Array, value: infer Arr } ?
            Arr extends Array<infer U> ? Array<UnwrapPortValue<U>> : never :
            // Object: recursively unwrap each field of the object
            T extends { type: PortTypeEnum.Object, value: infer O } ?
                { [K in keyof O]: UnwrapPortValue<O[K]> } :
              never

/**
 * UnwrappedPort takes a full port P (which must have a "value" field)
 * and returns its unwrapped (plain) value type.
 *
 * For example, if P.value is of type:
 *    { type: PortTypeEnum.Object, value: { field1: { type: PortTypeEnum.String, value: string } } }
 * then UnwrappedPort<P> will be:
 *    { field1: string }
 */
export type UnwrappedPort<P> =
  P extends { value: infer V } ? UnwrapPortValue<V> : never

/**
 * A helper function that recursively unwraps a port value.
 * (This is one possible runtime implementation; you may tweak it to match your object shapes.)
 */
export function getValue<P>(port: P): UnwrappedPort<P> {
  // A recursive function that “unwraps” the nested "value" property.
  function unwrap<T>(obj: any): any {
    if (obj && typeof obj === 'object' && 'type' in obj && 'value' in obj) {
      // For array type, map over each element recursively.
      if (obj.type === PortTypeEnum.Array) {
        return (obj.value as any[]).map(unwrap)
      }
      // For object type, unwrap each property.
      if (obj.type === PortTypeEnum.Object) {
        const result: any = {}
        for (const key in obj.value) {
          result[key] = unwrap(obj.value[key])
        }
        return result
      }
      // For scalar types, assume value is already a primitive.
      return obj.value
    }
    return obj
  }

  return unwrap((port as any).value)
}
