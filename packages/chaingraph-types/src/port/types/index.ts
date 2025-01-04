// Export from port-configs.ts
export type {
  ArrayPortConfig,
  ObjectPortConfig,
  ObjectProperty,
} from './port-configs'

// Export from port-interface.ts
export type {
  IPort,
  PortConfig,
  PortValidation,
} from './port-interface'

// Export from port-registry.ts
export type {
  PortTypeHandler,
  TypeValidationResult,
} from './port-registry'

export { PortTypeRegistry } from './port-registry'

// Export from port-types.ts
export {
  ComplexPortType,
  isComplexPortType,
  isPrimitivePortType,
  type PortType,
  PrimitivePortType,
} from './port-types'
// Export from port-values.ts
export type {
  ArrayValue,
  BaseTypeMap,
  ComplexPortValue,
  ExtractConfigValue,
  ExtractPortValue,
  ObjectPropertyValue,
  ObjectValue,
  PortValue,
  PrimitivePortValue,
  PrimitiveTypeMap,
  RecursivePortValue,
} from './port-values'

// Export from port-values-utils.ts
export type {
  ArrayOf,
  Cube,
  Matrix,
  NestedArrayPortType,
  NestedArrayValue,
  ObjectOf,
  PrimitiveValue,
} from './port-values-utils'
export {
  // createArrayConfig,
  // createNestedArrayType,
  createPrimitiveConfig,
} from './port-values-utils'
