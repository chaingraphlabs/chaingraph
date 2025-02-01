import { PortTypeEnum } from './port-types.enum'
import {
  StreamPortConfigSchema,
  StreamPortValueSchema,
} from './stream-port-schemas'
import {
  ArrayPortConfigSchema,
  BooleanPortConfigSchema,
  EnumPortConfigSchema,
  NumberPortConfigSchema,
  ObjectPortConfigSchema,
  PortConfigUnionSchema,
  StringPortConfigSchema,
} from './zod-port-configs'
import {
  ArrayPortValueSchema,
  BooleanPortValueSchema,
  EnumPortValueSchema,
  NumberPortValueSchema,
  ObjectPortValueSchema,
  PortValueUnionSchema,
  StringPortValueSchema,
} from './zod-port-values'

/**
 * Central registry mapping each port type to its corresponding schemas.
 * This is our single source of truth for all port type definitions.
 */
export const portTypeDefinitions = {
  [PortTypeEnum.String]: {
    configSchema: StringPortConfigSchema,
    valueSchema: StringPortValueSchema,
  },
  [PortTypeEnum.Number]: {
    configSchema: NumberPortConfigSchema,
    valueSchema: NumberPortValueSchema,
  },
  [PortTypeEnum.Boolean]: {
    configSchema: BooleanPortConfigSchema,
    valueSchema: BooleanPortValueSchema,
  },
  [PortTypeEnum.Enum]: {
    configSchema: EnumPortConfigSchema,
    valueSchema: EnumPortValueSchema,
  },
  [PortTypeEnum.Array]: {
    configSchema: ArrayPortConfigSchema,
    valueSchema: ArrayPortValueSchema,
  },
  [PortTypeEnum.Object]: {
    configSchema: ObjectPortConfigSchema,
    valueSchema: ObjectPortValueSchema,
  },
  [PortTypeEnum.Stream]: {
    configSchema: StreamPortConfigSchema,
    valueSchema: StreamPortValueSchema,
  },
} as const

// Export the unified schemas for convenience
export { PortConfigUnionSchema, PortValueUnionSchema }

// Type helper to get config schema for a specific port type
export type GetConfigSchema<T extends PortTypeEnum> = typeof portTypeDefinitions[T]['configSchema']

// Type helper to get value schema for a specific port type
export type GetValueSchema<T extends PortTypeEnum> = typeof portTypeDefinitions[T]['valueSchema']
