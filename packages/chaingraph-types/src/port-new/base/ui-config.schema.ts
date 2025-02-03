import { z } from 'zod'

/**
 * Base Zod schema for UI configuration
 * This schema defines the common UI properties that all port types can use
 */
export const basePortConfigUISchema = z.object({
  hidden: z.boolean().optional(),
  disabled: z.boolean().optional(),
  hideEditor: z.boolean().optional(),
  hidePort: z.boolean().optional(),
  bgColor: z.string().optional(),
  borderColor: z.string().optional(),
}).passthrough()

/**
 * String port UI configuration schema
 */
export const stringPortConfigUISchema = basePortConfigUISchema.merge(
  z.object({
    isTextArea: z.boolean().optional(),
    isPassword: z.boolean().optional(),
  }).passthrough(),
)

/**
 * Number port UI configuration schema
 */
export const numberPortConfigUISchema = basePortConfigUISchema.merge(
  z.object({
    isSlider: z.boolean().optional(),
    leftSliderLabel: z.string().optional(),
    rightSliderLabel: z.string().optional(),
  }).passthrough(),
)

/**
 * Array port UI configuration schema
 */
export const arrayPortConfigUISchema = basePortConfigUISchema.merge(
  z.object({
    addItemFormHidden: z.boolean().optional(),
    addItemFormSpoilerState: z.boolean().optional(),
    itemDeletable: z.boolean().optional(),
    enumValues: z.array(z.enum(['string', 'number', 'array', 'object', 'boolean', 'stream'])).optional(),
  }).passthrough(),
)

/**
 * Object port UI configuration schema
 */
export const objectPortConfigUISchema = basePortConfigUISchema.merge(
  z.object({
    addKeyFormHidden: z.boolean().optional(),
    addKeyFormSpoilerState: z.boolean().optional(),
    keyDeletable: z.boolean().optional(),
  }).passthrough(),
)

/**
 * Stream port UI configuration schema
 */
export const streamPortConfigUISchema = basePortConfigUISchema.passthrough()

/**
 * Boolean port UI configuration schema
 */
export const booleanPortConfigUISchema = basePortConfigUISchema.passthrough()

/**
 * Helper types to extract the inferred types from the UI schemas
 */
export type BasePortConfigUIType = z.infer<typeof basePortConfigUISchema>
export type StringPortConfigUIType = z.infer<typeof stringPortConfigUISchema>
export type NumberPortConfigUIType = z.infer<typeof numberPortConfigUISchema>
export type ArrayPortConfigUIType = z.infer<typeof arrayPortConfigUISchema>
export type ObjectPortConfigUIType = z.infer<typeof objectPortConfigUISchema>
export type StreamPortConfigUIType = z.infer<typeof streamPortConfigUISchema>
export type BooleanPortConfigUIType = z.infer<typeof booleanPortConfigUISchema>
