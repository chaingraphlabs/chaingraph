import { z } from 'zod'
import { MultiChannel, MultiChannelSchema } from './channel/multi-channel'
import { createPortConfigSchema } from './common/portConfigSchema'
import { PortTypeEnum } from './port-types.enum'
import { PortConfigUnionSchema } from './zod-port-configs'

// StreamPort config – similar to ArrayPort config but with an extra “mode” field.
// "itemConfig" describes the type of individual streamed items.
// "mode" can be either "input" or "output".
export const StreamPortConfigSchema = createPortConfigSchema(PortTypeEnum.Stream, z.object({
  mode: z.union([z.literal('input'), z.literal('output')]),
  itemConfig: z.lazy(() => PortConfigUnionSchema), // Lazy ref for circular dependency.
}))

// Preprocess the input: if it’s a MultiChannel instance, serialize it first.
const ProcessedMultiChannelSchema = z.preprocess((data) => {
  if (data instanceof MultiChannel) {
    return data.serialize()
  }
  return data
}, MultiChannelSchema)
  .transform(data => MultiChannel.deserialize(data))

// Now, build a proper ZodObject that matches the PortWrapper interface.
export const StreamPortValueSchema = z.object({
  type: z.literal(PortTypeEnum.Stream),
  value: ProcessedMultiChannelSchema,
})
