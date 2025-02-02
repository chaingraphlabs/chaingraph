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
      if (
        typeof value !== 'object'
        || value === null
        || value.type !== 'stream'
        || typeof value.channel !== 'object'
      ) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid stream value structure',
        )
      }

      const channel = value.channel
      const buffer = channel.getBuffer()

      const serializedBuffer = buffer.map((item, index) => {
        if (
          typeof item !== 'object'
          || item === null
          || !('type' in item)
          || typeof (item as any).type !== 'string'
        ) {
          throw new PortError(
            PortErrorType.SerializationError,
            `Invalid serialized item structure at index ${index}`,
          )
        }
        const itemType = (item as any).type as string
        const plugin = portRegistry.getPlugin(itemType as any)
        if (!plugin) {
          throw new PortError(
            PortErrorType.SerializationError,
            `No plugin found for type "${itemType}" at index ${index}`,
          )
        }
        return plugin.serializeValue(item)
      })

      return {
        type: 'stream',
        buffer: serializedBuffer,
        isClosed: channel.isChannelClosed(),
      }
    } catch (error) {
      if (error instanceof Error)
        throw error
      throw new PortError(
        PortErrorType.SerializationError,
        'Unknown error during stream serialization',
      )
    }
  },
  deserializeValue: (data: unknown) => {
    try {
      if (typeof data !== 'object' || data === null) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid serialized data: expected an object',
        )
      }

      const dataObj = data as { type?: unknown, buffer?: unknown, isClosed?: unknown }
      if (dataObj.type !== 'stream') {
        throw new PortError(
          PortErrorType.SerializationError,
          `Invalid serialized data: expected type "stream", got "${dataObj.type}"`,
        )
      }

      if (!Array.isArray(dataObj.buffer)) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid serialized data: "buffer" field must be an array',
        )
      }

      if (typeof dataObj.isClosed !== 'boolean') {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid serialized data: "isClosed" field must be a boolean',
        )
      }

      const deserializedBuffer = dataObj.buffer.map((serializedItem, index) => {
        if (
          typeof serializedItem !== 'object'
          || serializedItem === null
          || !('type' in serializedItem)
          || typeof (serializedItem as any).type !== 'string'
        ) {
          throw new PortError(
            PortErrorType.SerializationError,
            `Invalid serialized item structure at index ${index}`,
          )
        }
        const itemType = (serializedItem as any).type as string
        const plugin = portRegistry.getPlugin(itemType as any)
        if (!plugin) {
          throw new PortError(
            PortErrorType.SerializationError,
            `No plugin found for type "${itemType}" at index ${index}`,
          )
        }
        return plugin.deserializeValue(serializedItem)
      })

      const channel = new MultiChannel<IPortValue>()
      if (deserializedBuffer.length > 0) {
        channel.sendBatch(deserializedBuffer)
      }
      if (dataObj.isClosed) {
        channel.close()
      }
      return {
        type: 'stream',
        channel,
      }
    } catch (error) {
      if (error instanceof Error)
        throw error
      throw new PortError(
        PortErrorType.SerializationError,
        'Unknown error during stream deserialization',
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
