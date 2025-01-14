import { NodeEvents, NodeStatus } from '@chaingraph/types/node/node-enums'
import { z } from 'zod'

/**
 * Schema and type for base node event
 */
export const NodeEventSchema = z.object({
  nodeId: z.string(),
  timestamp: z.date(),
  type: z.nativeEnum(NodeEvents),
})

export type NodeEvent = z.infer<typeof NodeEventSchema>

/**
 * Schema and type for node status change event
 */
export const NodeStatusChangeEventSchema = NodeEventSchema.extend({
  type: z.literal(NodeEvents.StatusChange),
  node: z.any(), // TODO: Will be properly typed when full node schema is available
  oldStatus: z.nativeEnum(NodeStatus),
  newStatus: z.nativeEnum(NodeStatus),
})

export type NodeStatusChangeEvent = z.infer<typeof NodeStatusChangeEventSchema>

/**
 * Schema and type for node event
 */
export const NodeEventUnionSchema = z.discriminatedUnion('type', [
  NodeStatusChangeEventSchema,
])

export type NodeEventUnion = z.infer<typeof NodeEventUnionSchema>
