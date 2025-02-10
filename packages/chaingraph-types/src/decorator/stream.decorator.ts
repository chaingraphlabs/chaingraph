/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PortDecoratorOptions } from './port.decorator.types'
import { Port } from './port.decorator'

/**
 * PortStream decorator for defining a stream port.
 *
 * This decorator automatically sets the port type to "stream". You can optionally pass additional
 * configuration options (such as "itemConfig" for specifying the type and defaultValue for stream items).
 *
 * Example usage:
 *
 *   // Define a stream port for strings
 *   @PortStream({
 *     itemConfig: { type: 'string', defaultValue: '' }
 *   })
 *   public inputStream: MultiChannel<string>;
 *
 * @param config - Optional configuration for the stream port (excluding the "type" property).
 */
export function PortStream(
  config: Omit<PortDecoratorOptions<'stream'>, 'type'>,
): PropertyDecorator {
  return Port({
    type: 'stream',
    ...config,
  })
}
