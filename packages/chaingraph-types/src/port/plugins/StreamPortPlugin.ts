/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { JSONObject, JSONValue } from '../base/json'
import type {
  IPortConfig,
  IPortPlugin,
  IPortValue,
  StreamPortConfig,
  StreamPortValue,
} from '../base/types'
import { z } from 'zod'
import { basePortConfigSchema } from '../base/base-config.schema'
import {
  isStreamPortValue,
  PortError,
  PortErrorType,
} from '../base/types'
import { streamPortConfigUISchema } from '../base/ui-config.schema'
import { MultiChannel, MultiChannelSchema } from '../channel/multi-channel'
import { portRegistry } from '../registry/PortPluginRegistry'

/**
 * Helper to create a stream port value
 */
export function createStreamValue(channel: MultiChannel<IPortValue>): StreamPortValue {
  return channel
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
 * Stream port value schema
 */
const valueSchema: z.ZodType<StreamPortValue> = z.custom<MultiChannel<IPortValue>>((val) => {
  return val instanceof MultiChannel || MultiChannelSchema.safeParse(val).success
}, {
  message: 'Invalid channel type',
}).transform((val) => {
  if (val instanceof MultiChannel) {
    return val
  }

  return MultiChannel.deserialize(val)
})

/**
 * Stream-specific schema
 */
const streamSpecificSchema = z.object({
  type: z.literal('stream'),
  defaultValue: valueSchema.optional(),
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
  ui: streamPortConfigUISchema.optional(),
}).passthrough()

/**
 * Merge base schema with stream-specific schema to create the final config schema
 */
const configSchema: z.ZodType<StreamPortConfig> = basePortConfigSchema.merge(streamSpecificSchema)

/**
 * Stream port plugin implementation
 */
export const StreamPortPlugin: IPortPlugin<'stream'> = {
  typeIdentifier: 'stream',
  configSchema,
  valueSchema,
  serializeValue: (value: StreamPortValue, config: StreamPortConfig): JSONValue => {
    try {
      if (!isStreamPortValue(value)) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid stream value structure',
        )
      }

      const plugin = portRegistry.getPlugin(config.itemConfig.type)
      if (!plugin) {
        throw new PortError(
          PortErrorType.SerializationError,
          `No plugin found for type "${config.itemConfig.type}"`,
        )
      }

      const channel = value
      const buffer = channel.getBuffer()

      // Serialize each item in the buffer using its corresponding plugin
      const serializedBuffer = buffer.map((item, index) => {
        return plugin.serializeValue(item, config.itemConfig)
      })

      return {
        type: 'stream',
        buffer: serializedBuffer,
        isClosed: channel.isChannelClosed(),
      }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during stream serialization',
      )
    }
  },
  deserializeValue: (data: JSONValue, config: StreamPortConfig): StreamPortValue => {
    if (data instanceof MultiChannel) {
      return data
    }

    try {
      if (
        typeof data !== 'object'
        || data === null
        || !('type' in data)
        || data.type !== 'stream'
        || !('buffer' in data)
        || !Array.isArray(data.buffer)
        || !('isClosed' in data)
        || typeof data.isClosed !== 'boolean'
      ) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid stream value structure',
        )
      }

      const plugin = portRegistry.getPlugin(config.itemConfig.type)
      if (!plugin) {
        throw new PortError(
          PortErrorType.SerializationError,
          `No plugin found for type "${config.itemConfig.type}"`,
        )
      }

      // Deserialize each item in the buffer using its corresponding plugin
      const deserializedBuffer = data.buffer.map((serializedItem, index) => {
        return plugin.deserializeValue(serializedItem, config.itemConfig)
      })

      // Create a new channel and populate it
      const channel = new MultiChannel<IPortValue>()
      if (deserializedBuffer.length > 0) {
        channel.sendBatch(deserializedBuffer)
      }
      if (data.isClosed) {
        channel.close()
      }

      return channel
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during stream deserialization',
      )
    }
  },
  /**
   * Serialize the stream port configuration into a JSON-compatible object.
   * In particular, it serializes the nested itemConfig using its plugin, and if a
   * defaultValue is present, it is also serialized using the stream port value serialization.
   */
  serializeConfig: (config: StreamPortConfig): JSONValue => {
    try {
      const plugin = portRegistry.getPlugin(config.itemConfig.type)
      if (!plugin) {
        throw new PortError(
          PortErrorType.SerializationError,
          `Unknown item config type: ${config.itemConfig.type}`,
        )
      }
      const serialized: JSONObject = {
        ...config,
        // Serialize the nested item configuration.
        itemConfig: plugin.serializeConfig(config.itemConfig),
      }
      // If a default value is provided, serialize it as well.
      if (config.defaultValue) {
        serialized.defaultValue = StreamPortPlugin.serializeValue(config.defaultValue, config)
      }
      return serialized
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during stream config serialization',
      )
    }
  },
  /**
   * Deserialize the stream port configuration from a JSON-compatible object.
   * This function uses the configSchema to parse the input, then deserializes the nested itemConfig
   * and the defaultValue (if present) so that they are in their proper form.
   */
  deserializeConfig: (data: JSONValue): StreamPortConfig => {
    try {
      const copy = { ...(data as any) }

      const result = configSchema.safeParse(copy)
      if (!result.success) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid stream configuration for deserialization',
          result.error,
        )
      }

      const parsedData = result.data as any

      const plugin = portRegistry.getPlugin(parsedData.itemConfig.type)
      if (!plugin) {
        throw new PortError(
          PortErrorType.SerializationError,
          `Unknown item config type: ${parsedData.itemConfig.type}`,
        )
      }
      const deserializedConfig: any = {
        ...parsedData,
        itemConfig: plugin.deserializeConfig(parsedData.itemConfig),
      }

      if (deserializedConfig.defaultValue !== undefined) {
        deserializedConfig.defaultValue = StreamPortPlugin.deserializeValue(
          deserializedConfig.defaultValue,
          deserializedConfig,
        )
      }

      return deserializedConfig as StreamPortConfig
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during stream config deserialization',
      )
    }
  },
  validateValue: (value: StreamPortValue, _config: StreamPortConfig): string[] => {
    const errors: string[] = []

    // Basic structure check
    if (!isStreamPortValue(value)) {
      errors.push('Invalid stream value structure')
      return errors
    }

    // Check that channel is a valid MultiChannel instance
    // if (!(value instanceof MultiChannel)) {
    //   errors.push('Invalid channel: must be a MultiChannel instance')
    // }

    // if (val instanceof MultiChannel) {
    //   return val
    // }

    return errors
  },
  validateConfig: (config: StreamPortConfig): string[] => {
    const result = configSchema.safeParse(config)
    if (!result.success) {
      return result.error.errors.map((issue: z.ZodIssue) => issue.message)
    }

    return []
  },
}
