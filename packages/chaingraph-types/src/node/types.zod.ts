/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { z } from 'zod'
import { PortPluginRegistry } from '../port'
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
    isErrorPortCollapsed: z.boolean().optional(),
    isHidden: z.boolean().optional(),
    isMovingDisabled: z.boolean().optional(),
  }).optional(),
}).passthrough()

/**
 * Schema for node flow ports configuration
 */
export const FlowPortsSchema = z.object({
  disabledFlowPorts: z.boolean().optional().default(false),
  disabledAutoExecution: z.boolean().optional().default(false),
  disabledError: z.boolean().optional().default(false),
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
  // portsConfig: z.record(z.string(), PortPluginRegistry.getInstance().getConfigUnionSchema()).optional(),
  portsConfig: z.record(z.string(), z.any()).optional(),
  ui: NodeUIMetadataSchema.optional(),
  version: z.number().optional(),
  flowPorts: FlowPortsSchema.optional(),
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

export const SerializedPortSchema = z.object({
  config: PortPluginRegistry.getInstance().getConfigUnionSchema(),
  value: PortPluginRegistry.getInstance().getValueUnionSchema(),
}).passthrough()

//
// export interface SerializedSystemPorts {
//   error: {
//     id: string
//     value?: boolean
//   }
//   errorMessage: {
//     id: string
//     value?: string
//   }
//   execute: {
//     id: string
//     value?: boolean
//   }
//   success: {
//     id: string
//     value?: boolean
//   }
// }

/**
 * Schema for serialized node
 */
export const SerializedNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  metadata: NodeMetadataSchema,
  status: z.nativeEnum(NodeStatus),
  ports: z.array(SerializedPortSchema),
  systemPorts: z.object({
    error: z.object({
      id: z.string(),
      value: z.boolean().optional(),
    }),
    errorMessage: z.object({
      id: z.string(),
      value: z.string().optional(),
    }),
    execute: z.object({
      id: z.string(),
      value: z.boolean().optional(),
    }),
    success: z.object({
      id: z.string(),
      value: z.boolean().optional(),
    }),
  }).optional(),
  connections: z.record(z.string(), z.array(z.object({
    nodeId: z.string(),
    portId: z.string(),
  }))).optional(),
  schemaVersion: z.string().optional(),
})

export type SerializedNodeType = z.infer<typeof SerializedNodeSchema>
