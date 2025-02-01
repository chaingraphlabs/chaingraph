import { z } from 'zod'
import { PortTypeEnum } from './port-types.enum'

// Define the recursive type structure
type PortValueType = {
  type: PortTypeEnum.String
  value: string
} | {
  type: PortTypeEnum.Number
  value: number
} | {
  type: PortTypeEnum.Boolean
  value: boolean
} | {
  type: PortTypeEnum.Enum
  value: string
} | {
  type: PortTypeEnum.Array
  value: PortValueType[]
} | {
  type: PortTypeEnum.Object
  value: Record<string, PortValueType>
}

// Create a const assertion for the schema to avoid the let binding issue
function createPortValueSchemas() {
  // String Port Value
  const StringPortValueSchema = z.object({
    type: z.literal(PortTypeEnum.String),
    value: z.string(),
  })

  // Number Port Value
  const NumberPortValueSchema = z.object({
    type: z.literal(PortTypeEnum.Number),
    value: z.number(),
  })

  // Boolean Port Value
  const BooleanPortValueSchema = z.object({
    type: z.literal(PortTypeEnum.Boolean),
    value: z.boolean(),
  })

  // Enum Port Value
  const EnumPortValueSchema = z.object({
    type: z.literal(PortTypeEnum.Enum),
    value: z.string(),
  })

  // Forward reference for recursive schemas
  let PortValueUnionSchema: z.ZodType<PortValueType>

  // Helper function for recursion
  function getPortValueUnion(): z.ZodType<PortValueType> {
    return PortValueUnionSchema
  }

  // Array Port Value
  const ArrayPortValueSchema = z.object({
    type: z.literal(PortTypeEnum.Array),
    value: z.array(z.lazy(() => getPortValueUnion())),
  })

  // Object Port Value
  const ObjectPortValueSchema = z.object({
    type: z.literal(PortTypeEnum.Object),
    value: z.record(z.lazy(() => getPortValueUnion())),
  })

  // Define the union schema
  PortValueUnionSchema = z.discriminatedUnion('type', [
    StringPortValueSchema,
    NumberPortValueSchema,
    BooleanPortValueSchema,
    EnumPortValueSchema,
    ArrayPortValueSchema,
    ObjectPortValueSchema,
  ]) as z.ZodType<PortValueType>

  return {
    StringPortValueSchema,
    NumberPortValueSchema,
    BooleanPortValueSchema,
    EnumPortValueSchema,
    ArrayPortValueSchema,
    ObjectPortValueSchema,
    PortValueUnionSchema,
  } as const
}

// Export all schemas
const {
  StringPortValueSchema,
  NumberPortValueSchema,
  BooleanPortValueSchema,
  EnumPortValueSchema,
  ArrayPortValueSchema,
  ObjectPortValueSchema,
  PortValueUnionSchema,
} = createPortValueSchemas()

export {
  ArrayPortValueSchema,
  BooleanPortValueSchema,
  EnumPortValueSchema,
  NumberPortValueSchema,
  ObjectPortValueSchema,
  PortValueUnionSchema,
  StringPortValueSchema,
}

// Export inferred types
export type StringPortValue = z.infer<typeof StringPortValueSchema>
export type NumberPortValue = z.infer<typeof NumberPortValueSchema>
export type BooleanPortValue = z.infer<typeof BooleanPortValueSchema>
export type EnumPortValue = z.infer<typeof EnumPortValueSchema>
export type ArrayPortValue = z.infer<typeof ArrayPortValueSchema>
export type ObjectPortValue = z.infer<typeof ObjectPortValueSchema>
export type PortValue = z.infer<typeof PortValueUnionSchema>
