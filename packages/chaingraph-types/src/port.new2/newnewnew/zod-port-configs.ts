import { z } from 'zod'
import { PortTypeEnum } from './port-types.enum'

// Define the recursive type structure
interface BasePortFields {
  id?: string
  name?: string
  metadata?: Record<string, unknown>
}

type PortConfigType = BasePortFields & ({
  type: PortTypeEnum.String
} | {
  type: PortTypeEnum.Number
} | {
  type: PortTypeEnum.Boolean
} | {
  type: PortTypeEnum.Enum
  options: PortConfigType[]
} | {
  type: PortTypeEnum.Array
  itemConfig: PortConfigType
} | {
  type: PortTypeEnum.Object
  schema: Record<string, PortConfigType>
})

// Create a const assertion for the schema to avoid the let binding issue
function createPortConfigUnionSchema() {
  // Base schema for all port configurations
  const BasePortConfigSchema = z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  })

  // String Port Config
  const StringPortConfigSchema = BasePortConfigSchema.extend({
    type: z.literal(PortTypeEnum.String),
  })

  // Number Port Config
  const NumberPortConfigSchema = BasePortConfigSchema.extend({
    type: z.literal(PortTypeEnum.Number),
  })

  // Boolean Port Config
  const BooleanPortConfigSchema = BasePortConfigSchema.extend({
    type: z.literal(PortTypeEnum.Boolean),
  })

  // Forward reference for recursive schemas
  let PortConfigUnionSchema: z.ZodType<PortConfigType>

  // Helper function for recursion
  function getPortConfigUnion(): z.ZodType<PortConfigType> {
    return PortConfigUnionSchema
  }

  // Enum Port Config
  const EnumPortConfigSchema = BasePortConfigSchema.extend({
    type: z.literal(PortTypeEnum.Enum),
    options: z.array(z.lazy(() => getPortConfigUnion())),
  })

  // Array Port Config
  const ArrayPortConfigSchema = BasePortConfigSchema.extend({
    type: z.literal(PortTypeEnum.Array),
    itemConfig: z.lazy(() => getPortConfigUnion()),
  })

  // Object Port Config
  const ObjectPortConfigSchema = BasePortConfigSchema.extend({
    type: z.literal(PortTypeEnum.Object),
    schema: z.record(z.lazy(() => getPortConfigUnion())),
  })

  // Define the union schema
  PortConfigUnionSchema = z.discriminatedUnion('type', [
    StringPortConfigSchema,
    NumberPortConfigSchema,
    BooleanPortConfigSchema,
    EnumPortConfigSchema,
    ArrayPortConfigSchema,
    ObjectPortConfigSchema,
  ]) as z.ZodType<PortConfigType>

  return {
    BasePortConfigSchema,
    StringPortConfigSchema,
    NumberPortConfigSchema,
    BooleanPortConfigSchema,
    EnumPortConfigSchema,
    ArrayPortConfigSchema,
    ObjectPortConfigSchema,
    PortConfigUnionSchema,
  } as const
}

// Export all schemas
const {
  BasePortConfigSchema,
  StringPortConfigSchema,
  NumberPortConfigSchema,
  BooleanPortConfigSchema,
  EnumPortConfigSchema,
  ArrayPortConfigSchema,
  ObjectPortConfigSchema,
  PortConfigUnionSchema,
} = createPortConfigUnionSchema()

export {
  ArrayPortConfigSchema,
  BasePortConfigSchema,
  BooleanPortConfigSchema,
  EnumPortConfigSchema,
  NumberPortConfigSchema,
  ObjectPortConfigSchema,
  PortConfigUnionSchema,
  StringPortConfigSchema,
}

// Export inferred types
export type BasePortConfig = z.infer<typeof BasePortConfigSchema>
export type StringPortConfig = z.infer<typeof StringPortConfigSchema>
export type NumberPortConfig = z.infer<typeof NumberPortConfigSchema>
export type BooleanPortConfig = z.infer<typeof BooleanPortConfigSchema>
export type EnumPortConfig = z.infer<typeof EnumPortConfigSchema>
export type ArrayPortConfig = z.infer<typeof ArrayPortConfigSchema>
export type ObjectPortConfig = z.infer<typeof ObjectPortConfigSchema>
export type PortConfig = z.infer<typeof PortConfigUnionSchema>
