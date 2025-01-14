/*
 * * * * * * * * * * *
 * Port Validation
 * * * * * * * * * * *
 */
import { z } from 'zod'

export const StringPortValidationSchema = z.object({}).optional()
export const NumberPortValidationSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
}).optional()
export const BooleanPortValidationSchema = z.object({}).optional()
export const ArrayPortValidationSchema = z.object({}).optional()
export const ObjectPortValidationSchema = z.object({}).optional()
export const EnumPortValidationSchema = z.object({}).optional()
export const StreamOutputPortValidationSchema = z.object({}).optional()
export const StreamInputPortValidationSchema = z.object({}).optional()
export const PortValidationSchema = z.union([
  StringPortValidationSchema,
  NumberPortValidationSchema,
  BooleanPortValidationSchema,
  ArrayPortValidationSchema,
  ObjectPortValidationSchema,
  EnumPortValidationSchema,
  StreamOutputPortValidationSchema,
  StreamInputPortValidationSchema,
])

export interface StringPortValidation {
  // Define properties for string validation
}

export interface NumberPortValidation {
  // Define properties for number validation
  min?: number
  max?: number
}

export interface BooleanPortValidation {
  // Define properties for boolean validation
}

export interface ArrayPortValidation {
  // Define properties for array validation
}

export interface ObjectPortValidation {
  // Define properties for object validation
}

export interface EnumPortValidation {
  // Define properties for enum validation
}

export interface StreamOutputPortValidation {
  // Define properties for stream output validation
}

export interface StreamInputPortValidation {
  // Define properties for stream input validation
}

export type PortValidation =
  | StringPortValidation
  | NumberPortValidation
  | BooleanPortValidation
  | ArrayPortValidation
  | ObjectPortValidation
  | EnumPortValidation
  | StreamOutputPortValidation
  | StreamInputPortValidation
