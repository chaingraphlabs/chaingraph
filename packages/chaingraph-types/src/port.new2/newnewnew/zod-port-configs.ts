import { z } from 'zod'
import { BasePortConfigSchema, createPortConfigSchema, JSONValueSchema } from './common/portConfigSchema'
import { PortTypeEnum } from './port-types.enum'

// Create a function to handle the circular dependencies
function createPortConfigSchemas() {
  // Using an empty extra schema for port types that do not require extra fields.
  const EmptyExtra = z.object({})

  // Forward reference for recursive schemas
  let PortConfigUnionSchema: z.ZodType<any>

  // Helper function for recursion
  function getPortConfigUnion() {
    return PortConfigUnionSchema
  }

  // Extra schema for Enum port config (contains "options")
  const EnumExtra = z.object({
    options: z.array(z.lazy(() => getPortConfigUnion())),
  })

  // Extra schema for Array port config (contains "itemConfig")
  const ArrayExtra = z.object({
    itemConfig: z.lazy(() => getPortConfigUnion()),
  })

  // Extra schema for Object port config (contains "schema")
  const ObjectExtra = z.object({
    schema: z.record(z.lazy(() => getPortConfigUnion())),
  })

  const StreamExtra = z.object({
    mode: z.union([z.literal('input'), z.literal('output')]),
    itemConfig: z.lazy(() => getPortConfigUnion()),
  })

  // Create individual port config schemas using our generic helper
  const StringPortConfigSchema = createPortConfigSchema(PortTypeEnum.String, EmptyExtra)
  const NumberPortConfigSchema = createPortConfigSchema(PortTypeEnum.Number, EmptyExtra)
  const BooleanPortConfigSchema = createPortConfigSchema(PortTypeEnum.Boolean, EmptyExtra)
  const EnumPortConfigSchema = createPortConfigSchema(PortTypeEnum.Enum, EnumExtra)
  const ArrayPortConfigSchema = createPortConfigSchema(PortTypeEnum.Array, ArrayExtra)
  const ObjectPortConfigSchema = createPortConfigSchema(PortTypeEnum.Object, ObjectExtra)
  const StreamPortConfigSchema = createPortConfigSchema(PortTypeEnum.Stream, StreamExtra)

  // Define the union schema
  PortConfigUnionSchema = z.discriminatedUnion('type', [
    StringPortConfigSchema,
    NumberPortConfigSchema,
    BooleanPortConfigSchema,
    EnumPortConfigSchema,
    ArrayPortConfigSchema,
    ObjectPortConfigSchema,
    StreamPortConfigSchema,
  ])

  return {
    StringPortConfigSchema,
    NumberPortConfigSchema,
    BooleanPortConfigSchema,
    EnumPortConfigSchema,
    ArrayPortConfigSchema,
    ObjectPortConfigSchema,
    StreamPortConfigSchema,
    PortConfigUnionSchema,
  } as const
}

// Export all schemas
const {
  StringPortConfigSchema,
  NumberPortConfigSchema,
  BooleanPortConfigSchema,
  EnumPortConfigSchema,
  ArrayPortConfigSchema,
  ObjectPortConfigSchema,
  StreamPortConfigSchema,
  PortConfigUnionSchema,
} = createPortConfigSchemas()

export {
  ArrayPortConfigSchema,
  BasePortConfigSchema,
  BooleanPortConfigSchema,
  EnumPortConfigSchema,
  JSONValueSchema,
  NumberPortConfigSchema,
  ObjectPortConfigSchema,
  PortConfigUnionSchema,
  StreamPortConfigSchema,
  StringPortConfigSchema,
}

// Export inferred types
export type ArrayPortConfig = z.infer<typeof ArrayPortConfigSchema>
export type BasePortConfig = z.infer<typeof BasePortConfigSchema>
export type BooleanPortConfig = z.infer<typeof BooleanPortConfigSchema>
export type EnumPortConfig = z.infer<typeof EnumPortConfigSchema>
export type NumberPortConfig = z.infer<typeof NumberPortConfigSchema>
export type ObjectPortConfig = z.infer<typeof ObjectPortConfigSchema>
export type StringPortConfig = z.infer<typeof StringPortConfigSchema>
export type StreamPortConfig = z.infer<typeof StreamPortConfigSchema>

export type PortConfig = z.infer<typeof PortConfigUnionSchema>
