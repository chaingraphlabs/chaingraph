/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { JSONValue } from '../../utils/json'
import type { IPort, IPortConfig, StreamPortConfig, StreamPortValue } from '../base'
import { deepCopy } from '../../utils'
import { BasePort } from '../base'
import { generatePortID } from '../id-generate'
import { StreamPortPlugin } from '../plugins'

/**
 * Concrete implementation of a Stream Port.
 *
 * This class extends BasePort using StreamPortConfig and StreamPortValue.
 * It leverages the StreamPortPlugin to handle default value resolution,
 * validation, serialization, and deserialization.
 *
 * In a Stream Port, the value represents a channel (typically implemented by MultiChannel)
 * that holds port values. When you serialize the port, the channel’s buffer and its closed-state
 * get serialized and later restored on deserialization.
 *
 * Example usage:
 *
 *   // Create a stream port configuration. Assume that a stream is used to push a series of
 *   // port values (for example, strings or numbers). The "itemConfig" defines the type of
 *   // items allowed on this stream.
 *
 *   const streamConfig = createStreamPortConfig({
 *     type: 'stream',
 *     itemConfig: { type: 'string', minLength: 2 },
 *     // Optionally, you might include a default value that represents the initial channel state.
 *   })
 *
 *   // Create the stream port:
 *   const streamPort = new StreamPort(streamConfig)
 *
 *   // Later, obtain the stream channel (the port value) and subscribe to values:
 *   const channel = streamPort.getValue()?.value
 *   if (channel) {
 *     for await (const item of channel) {
 *       console.log(item)
 *     }
 *   }
 *
 * @returns A fully functional Stream Port instance.
 */
export class StreamPort<Item extends IPortConfig = IPortConfig> extends BasePort<StreamPortConfig<Item>> {
  constructor(config: StreamPortConfig<Item>) {
    const defaultUi = {
      bgColor: '#ffa047',
      borderColor: '#4b2e12',
    }

    const mergedConfig = { ...config, ui: { ...defaultUi, ...config.ui } }
    super(mergedConfig)
  }

  /**
   * Retrieves the default value from the configuration.
   * If a defaultValue is provided in config, it is returned;
   * otherwise, undefined is returned.
   *
   * @returns The default StreamPortValue, if specified.
   */
  getDefaultValue(): StreamPortValue<Item> | undefined {
    return this.config.defaultValue
  }

  /**
   * Optionally override getValue() so that the returned type is StreamPortValue.
   *
   * @returns The current stream port value.
   */
  getValue(): StreamPortValue<Item> | undefined {
    return super.getValue()
  }

  /**
   * Validates the provided stream port value against the configuration.
   * Delegates validation logic to StreamPortPlugin.validateValue.
   *
   * @param value - The stream port value to validate.
   * @returns True if valid; otherwise false.
   */
  validateValue(value: StreamPortValue<Item>): boolean {
    const errors = StreamPortPlugin.validateValue(value, this.config)
    return errors.length === 0
  }

  /**
   * Validates the stream port configuration.
   * Delegates to StreamPortPlugin.validateConfig.
   *
   * @param config - The stream port configuration.
   * @returns True if valid; otherwise false.
   */
  validateConfig(config: StreamPortConfig<Item>): boolean {
    const errors = StreamPortPlugin.validateConfig(config)
    return errors.length === 0
  }

  /**
   * Serializes the stream port configuration to a JSON-compatible object.
   * Delegates serialization to StreamPortPlugin.serializeConfig.
   *
   * @param config - The stream port configuration.
   * @returns The serialized configuration.
   */
  serializeConfig(config: StreamPortConfig<Item>): JSONValue {
    return StreamPortPlugin.serializeConfig(config)
  }

  /**
   * Serializes the stream port value into a JSON-compatible object.
   * Delegates serialization to StreamPortPlugin.serializeValue.
   *
   * @param value - The stream port value.
   * @returns The serialized value.
   */
  serializeValue(value: StreamPortValue<Item>): JSONValue {
    return StreamPortPlugin.serializeValue(value, this.config)
  }

  /**
   * Deserializes the provided JSON data into a stream port configuration.
   * Delegates to StreamPortPlugin.deserializeConfig.
   *
   * @param data - The JSON data representing the configuration.
   * @returns The deserialized configuration.
   */
  deserializeConfig(data: JSONValue): StreamPortConfig<Item> {
    return StreamPortPlugin.deserializeConfig(data) as StreamPortConfig<Item>
  }

  /**
   * Deserializes the provided JSON data into a stream port value.
   * Delegates to StreamPortPlugin.deserializeValue.
   *
   * @param data - The JSON data representing the port value.
   * @returns The deserialized port value.
   */
  deserializeValue(data: JSONValue): StreamPortValue<Item> {
    return StreamPortPlugin.deserializeValue(data, this.config) as StreamPortValue<Item>
  }

  /**
   * Clones the port with a new ID.
   * Useful for creating copies of the port with a unique identifier.
   */
  cloneWithNewId(): IPort<StreamPortConfig<Item>> {
    const port = new StreamPort<Item>({
      ...this.config,
      id: generatePortID(this.config.key || this.config.id || ''),
    })
    if (this.value) {
      port.setValue(deepCopy(this.value)) // Set the current value
    }
    return port
  }
}

/**
 * Helper function to create a StreamPortConfig.
 *
 * This function helps ensure that the configuration object is constructed
 * with proper type inference – you do not need to explicitly specify generic
 * parameters.
 *
 * Example:
 *
 *   const config = createStreamPortConfig<StringPortConfig>({
 *     type: 'stream',
 *     itemConfig: { type: 'string', minLength: 2 },
 *   })
 *
 * @param config - The stream port configuration.
 * @returns The same configuration object.
 */
export function createStreamPortConfig<Item extends IPortConfig>(
  config: StreamPortConfig<Item>,
): StreamPortConfig<Item> {
  return config
}
