/**
 * Schema organization for port system
 */
import type { z } from 'zod'

// Import schemas for type inference
import type {
  anyConfigSchema,
  arrayConfigSchema,
  booleanConfigSchema,
  enumConfigSchema,
  numberConfigSchema,
  objectConfigSchema,
  portConfigSchema,
  streamConfigSchema,
  stringConfigSchema,
} from './config'

// Base schemas and utilities
export {
  applyLengthValidation,
  applyRangeValidation,
  baseMetadataSchema,
  basePortPropsSchema,
  createLengthValidation,
  createMinMaxValidation,
  createRangeValidation,
  hasLengthValidation,
  hasRangeValidation,
  hasValidation,
} from './base'

// Configuration schemas
export {
  anyConfigSchema,
  arrayConfigSchema,
  booleanConfigSchema,
  enumConfigSchema,
  isPortConfig,
  isPortType,
  numberConfigSchema,
  objectConfigSchema,
  portConfigSchema,
  streamConfigSchema,
  stringConfigSchema,
  validatePortConfig,
  validatePortConfigType,
} from './config'

// Value schemas
export {
  applyValidation,
  arrayValueSchema,
  booleanValueSchema,
  createValidatedValueSchema,
  createValueSchema,
  numberValueSchema,
  objectValueSchema,
  stringValueSchema,
} from './value'

// Export inferred types
export type PortConfig = z.infer<typeof portConfigSchema>
export type StringPortConfig = z.infer<typeof stringConfigSchema>
export type NumberPortConfig = z.infer<typeof numberConfigSchema>
export type BooleanPortConfig = z.infer<typeof booleanConfigSchema>
export type ArrayPortConfig = z.infer<typeof arrayConfigSchema>
export type ObjectPortConfig = z.infer<typeof objectConfigSchema>
export type EnumPortConfig = z.infer<typeof enumConfigSchema>
export type StreamPortConfig = z.infer<typeof streamConfigSchema>
export type AnyPortConfig = z.infer<typeof anyConfigSchema>

// Export Zod types for schema manipulation
export type { z }
