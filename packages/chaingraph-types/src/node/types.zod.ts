import { z } from 'zod'
import { BasePortConfigSchema, PortValueSchema } from '../port'
import { ExecutionStatus, NodeCategory, NodeStatus, ValidationMessageType } from './node-enums'

/**
 * Schema for node UI metadata
 */
export const NodeUIMetadataSchema = z.object({
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  dimensions: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
  style: z.object({
    backgroundColor: z.string().optional(),
    borderColor: z.string().optional(),
  }).optional(),
  state: z.object({
    isSelected: z.boolean().optional(),
    isHighlighted: z.boolean().optional(),
    isDisabled: z.boolean().optional(),
  }).optional(),
})

/**
 * Schema for node metadata
 */
export const NodeMetadataSchema = z.object({
  type: z.string(),
  id: z.string().optional(),
  title: z.string().optional(),
  category: z.nativeEnum(NodeCategory).default(NodeCategory.Custom).optional(),
  description: z.string().optional(),
  version: z.string().optional(),
  icon: z.string().optional(),
  tags: z.array(z.string()).optional(),
  author: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  portsConfig: z.map(z.string(), BasePortConfigSchema).optional(),
  ui: NodeUIMetadataSchema.optional(),
})

/**
 * Schema for validation message
 */
export const ValidationMessageSchema = z.object({
  type: z.nativeEnum(ValidationMessageType),
  message: z.string(),
  portId: z.string().optional(),
})

/**
 * Schema for node validation result
 */
export const NodeValidationResultSchema = z.object({
  isValid: z.boolean(),
  messages: z.array(ValidationMessageSchema),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * Schema for node execution result
 */
export const NodeExecutionResultSchema = z.object({
  status: z.nativeEnum(ExecutionStatus),
  startTime: z.date(),
  endTime: z.date(),
  outputs: z.map(z.string(), z.unknown()),
  error: z.instanceof(Error).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * Schema for serialized node
 */
export const SerializedNodeSchema = z.object({
  id: z.string(),
  metadata: NodeMetadataSchema,
  status: z.nativeEnum(NodeStatus),
  ports: z.map(z.string(), z.object({
    config: BasePortConfigSchema,
    value: PortValueSchema,
  })).optional(),
})
