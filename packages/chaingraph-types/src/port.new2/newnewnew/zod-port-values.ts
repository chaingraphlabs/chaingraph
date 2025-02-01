import type { EnsureJSONSerializable } from '@chaingraph/types/port.new2/newnewnew/json'
import { z } from 'zod'
import { PortTypeEnum } from './port-types.enum'
import { StreamPortValueSchema } from './stream-port-schemas'

// Create a function to handle the circular dependencies
function createPortValueSchemas() {
  // Create basic value schemas
  const StringPortValueSchema = z.object({
    type: z.literal(PortTypeEnum.String),
    value: z.string(),
  })

  const NumberPortValueSchema = z.object({
    type: z.literal(PortTypeEnum.Number),
    value: z.number(),
  })

  const BooleanPortValueSchema = z.object({
    type: z.literal(PortTypeEnum.Boolean),
    value: z.boolean(),
  })

  const EnumPortValueSchema = z.object({
    type: z.literal(PortTypeEnum.Enum),
    value: z.string(),
  })

  // Forward reference for recursive schemas
  let PortValueUnionSchema: z.ZodType<any>

  // Helper function for recursion
  function getPortValueUnion() {
    return PortValueUnionSchema
  }

  // Create array and object schemas with lazy evaluation for recursion
  const ArrayPortValueSchema = z.object({
    type: z.literal(PortTypeEnum.Array),
    value: z.array(z.lazy(() => getPortValueUnion())),
  })

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
    StreamPortValueSchema,
  ])

  return {
    ArrayPortValueSchema,
    BooleanPortValueSchema,
    EnumPortValueSchema,
    NumberPortValueSchema,
    ObjectPortValueSchema,
    StringPortValueSchema,
    StreamPortValueSchema,
    PortValueUnionSchema,
  } as const
}

// Export all schemas
const {
  ArrayPortValueSchema,
  BooleanPortValueSchema,
  EnumPortValueSchema,
  NumberPortValueSchema,
  ObjectPortValueSchema,
  StringPortValueSchema,
  PortValueUnionSchema,
  StreamPortValueSchema,
} = createPortValueSchemas()

export {
  ArrayPortValueSchema,
  BooleanPortValueSchema,
  EnumPortValueSchema,
  NumberPortValueSchema,
  ObjectPortValueSchema,
  PortValueUnionSchema,
  StreamPortValueSchema,
  StringPortValueSchema,
}

// Export inferred types
export type ArrayPortValue = z.infer<typeof ArrayPortValueSchema>
export type BooleanPortValue = z.infer<typeof BooleanPortValueSchema>
export type EnumPortValue = z.infer<typeof EnumPortValueSchema>
export type NumberPortValue = z.infer<typeof NumberPortValueSchema>
export type ObjectPortValue = z.infer<typeof ObjectPortValueSchema>
export type StringPortValue = z.infer<typeof StringPortValueSchema>
export type PortValue = EnsureJSONSerializable<z.infer<typeof PortValueUnionSchema>>
