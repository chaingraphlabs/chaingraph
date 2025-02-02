import type {
  IPortConfig,
  IPortPlugin,
  IPortValue,
  StreamPortConfig,
  StreamPortValue,
} from '../base/types'
import { z } from 'zod'
import {
  isStreamPortValue,
  PortError,
  PortErrorType,
} from '../base/types'
import { MultiChannel } from '../channel/multi-channel'
import { portRegistry } from '../registry/PortRegistry'

/**
 * Helper to create a stream port value
 */
export function createStreamValue(channel: MultiChannel<IPortValue>): StreamPortValue {
  return {
    type: 'stream',
    channel,
  }
}

/**
 * Helper to create a stream port config
 */
export function createStreamConfig(
  itemConfig: IPortConfig,
  options: Partial<Omit<StreamPortConfig, 'type' | 'itemConfig'>> = {},
): StreamPortConfig {
  return {
    type: 'stream',
    itemConfig,
    ...options,
  }
}

/**
 * Validate stream value against config
 */
export function validateStreamValue(
  value: unknown,
  config: StreamPortConfig,
): string[] {
  const errors: string[] = []

  // Only validate basic structure
  if (!isStreamPortValue(value)) {
    errors.push('Invalid stream value structure')
    return errors
  }

  return errors
}

/**
 * Stream port configuration schema
 */
const configSchema: z.ZodType<StreamPortConfig> = z.object({
  type: z.literal('stream'),
  id: z.string().optional(),
  name: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  itemConfig: z.custom<IPortConfig>((val) => {
    if (
      typeof val !== 'object'
      || val === null
      || !('type' in val)
      || typeof val.type !== 'string'
    ) {
      return false
    }

    const plugin = portRegistry.getPlugin(val.type)
    return plugin !== undefined
  }, {
    message: 'Invalid item config type',
  }),
}).passthrough()

/**
 * Stream port value schema
 */
const valueSchema: z.ZodType<StreamPortValue> = z.object({
  type: z.literal('stream'),
  channel: z.custom<MultiChannel<IPortValue>>((val) => {
    return val instanceof MultiChannel
  }, {
    message: 'Invalid channel type',
  }),
}).passthrough()

/**
 * Stream port plugin implementation
 */
export const StreamPortPlugin: IPortPlugin<'stream'> = {
  typeIdentifier: 'stream',
  configSchema,
  valueSchema,
  serializeValue: (value: StreamPortValue) => {
    try {
      if (!isStreamPortValue(value)) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid stream value structure',
        )
      }

      // Get the buffer and serialize each item
      const buffer = value.channel.getBuffer()
      const serializedBuffer = buffer.map(item => item)

      return {
        type: 'stream',
        buffer: serializedBuffer,
        isClosed: value.channel.isChannelClosed(),
      }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during stream serialization',
      )
    }
  },
  deserializeValue: (data: unknown) => {
    try {
      // Basic structure validation
      if (
        typeof data !== 'object'
        || data === null
        || !('type' in data)
        || data.type !== 'stream'
        || !('buffer' in data)
        || !Array.isArray((data as any).buffer)
        || !('isClosed' in data)
        || typeof (data as any).isClosed !== 'boolean'
      ) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid stream data structure',
        )
      }

      const { buffer, isClosed } = data as {
        buffer: IPortValue[]
        isClosed: boolean
      }

      const channel = new MultiChannel<IPortValue>()

      // Add items to buffer without validation
      if (buffer.length > 0) {
        channel.sendBatch(buffer)
      }

      // Close channel if it was closed before serialization
      if (isClosed) {
        channel.close()
      }

      return {
        type: 'stream',
        channel,
      }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during stream deserialization',
      )
    }
  },
  serializeConfig: (config: StreamPortConfig) => {
    try {
      // We need to serialize the itemConfig using its corresponding plugin
      const plugin = portRegistry.getPlugin(config.itemConfig.type)
      if (!plugin) {
        throw new PortError(
          PortErrorType.SerializationError,
          `Unknown item config type: ${config.itemConfig.type}`,
        )
      }

      return {
        ...config,
        itemConfig: plugin.serializeConfig(config.itemConfig),
      }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during stream config serialization',
      )
    }
  },
  deserializeConfig: (data: unknown) => {
    try {
      const result = configSchema.safeParse(data)
      if (!result.success) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid stream configuration for deserialization',
          result.error,
        )
      }

      // We need to deserialize the itemConfig using its corresponding plugin
      const plugin = portRegistry.getPlugin(result.data.itemConfig.type)
      if (!plugin) {
        throw new PortError(
          PortErrorType.SerializationError,
          `Unknown item config type: ${result.data.itemConfig.type}`,
        )
      }

      return {
        ...result.data,
        itemConfig: plugin.deserializeConfig(result.data.itemConfig),
      }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during stream config deserialization',
      )
    }
  },
  validate: (value: StreamPortValue, _config: StreamPortConfig): string[] => {
    const errors: string[] = []

    // Basic structure check
    if (!isStreamPortValue(value)) {
      errors.push('Invalid stream value structure')
      return errors
    }

    // Check that channel is a valid MultiChannel instance
    if (!(value.channel instanceof MultiChannel)) {
      errors.push('Invalid channel: must be a MultiChannel instance')
    }

    return errors
  },
}
