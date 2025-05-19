/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { z } from 'zod'
import { JSONValueSchema } from '../../utils/json'
import { PortDirection } from './types'

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
    textareaDimensions: z.object({
      width: z.number().optional(),
      height: z.number().optional(),
    }).optional(),
    placeholder: z.string().optional(),
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
    enumValues: z.array(z.enum([
      'string',
      'number',
      'array',
      'object',
      'boolean',
      'stream',
      'enum',
      'any',
    ])).optional(),
  }).passthrough(),
)
/**
 * Object port UI configuration schema
 */
export const objectPortConfigUISchema = basePortConfigUISchema.merge(
  z.object({
    collapsed: z.boolean().optional(),
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
export const enumPortConfigUISchema = basePortConfigUISchema.passthrough()
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
export type EnumPortConfigUIType = z.infer<typeof enumPortConfigUISchema>

/**
 * Base Zod schema for all port configurations
 * This schema should be used as the foundation for all concrete port config schemas
 * to ensure consistent validation and structure across all port types.
 */
export const basePortConfigSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  metadata: z.record(z.string(), JSONValueSchema).optional(),
  required: z.boolean().optional(),
  parentId: z.string().optional(),
  nodeId: z.string().optional(),
  key: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  direction: z.enum([PortDirection.Input, PortDirection.Output]).optional(),
  ui: basePortConfigUISchema.optional(),
  connections: z.array(z.object({
    nodeId: z.string(),
    portId: z.string(),
  })).optional(),
  order: z.number().optional(),
}).passthrough()

/**
 * Helper type to extract the inferred type from the base schema
 */
export type BasePortConfigType = z.infer<typeof basePortConfigSchema>
