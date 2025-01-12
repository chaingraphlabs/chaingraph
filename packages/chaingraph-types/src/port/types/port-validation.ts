/*
 * * * * * * * * * * *
 * Port Validation
 * * * * * * * * * * *
 */
import { z } from 'zod'

export const StringPortValidationSchema = z.object({}).optional()
export const NumberPortValidationSchema = z.object({}).optional()
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
