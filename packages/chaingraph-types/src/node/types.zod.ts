import { portRegistry } from '@badaitech/chaingraph-types/port/registry'
import { z } from 'zod'
import { NodeExecutionStatus, NodeStatus, ValidationMessageType } from './node-enums'

/**
 * Schema for node UI metadata
 */
export const NodeUIMetadataSchema = z.object({
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  dimensions: z.object({
    width: z.number(),
    height: z.number(),
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
}).passthrough()

/**
 * Schema for node metadata
 */
export const NodeMetadataSchema = z.lazy(() => z.object({
  type: z.string(),
  id: z.string().optional(),
  title: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  tags: z.array(z.string()).optional(),
  author: z.string().optional(),
  parentNodeId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  portsConfig: z.record(z.string(), portRegistry.getConfigUnionSchema()).optional(),
  ui: NodeUIMetadataSchema.optional(),
  version: z.number().optional(),
}).passthrough())

/**
 * Schema for validation message
 */
export const ValidationMessageSchema = z.object({
  type: z.nativeEnum(ValidationMessageType),
  message: z.string(),
  portId: z.string().optional(),
}).passthrough()

/**
 * Schema for node validation result
 */
export const NodeValidationResultSchema = z.object({
  isValid: z.boolean(),
  messages: z.array(ValidationMessageSchema),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

/**
 * Schema for node execution result
 */
export const NodeExecutionResultSchema = z.object({
  status: z.nativeEnum(NodeExecutionStatus),
  startTime: z.date(),
  endTime: z.date(),
  outputs: z.record(z.string(), z.unknown()),
  error: z.instanceof(Error).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

/**
 * Schema for serialized node
 */
export const SerializedNodeSchema = z.lazy(() => z.object({
  id: z.string(),
  metadata: NodeMetadataSchema,
  status: z.nativeEnum(NodeStatus),
  // ports: z.record(z.string(), z.object({
  //   config: portRegistry.getConfigUnionSchema(),
  //   value: portRegistry.getValueUnionSchema(),
  // })).optional(),

  ports_values: z.record(z.string(), z.any()).optional(),
}).passthrough())
