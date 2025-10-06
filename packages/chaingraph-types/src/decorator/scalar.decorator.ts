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
 * String decorator to specify a port configuration for type "string".
 * This decorator automatically sets the port type to "string", so that you do not have to specify it.
 * Optional configuration properties (such as defaultValue, minLength, maxLength, etc.) can be passed.
 *
 * Usage examples:
 * ```
 *   // Using default configuration:
 *   @PortString()
 *   public myPort: string = '';
 *
 *   // With custom configuration:
 *   @PortString({ defaultValue: 'hello', minLength: 1, maxLength: 100 })
 *   public myPort?: string;
 * ```
 *
 * @param config Optional configuration object for additional options.
 */
export function PortString(config?: Omit<PortDecoratorOptions<'string'>, 'type'>): PropertyDecorator {
  return Port({
    type: 'string',
    ...config,
    ...('defaultValue' in (config || {})
      ? { defaultValue: config?.defaultValue }
      : { defaultValue: undefined }),
  })
}

/**
 * Number decorator to specify a port configuration for type "number".
 * This decorator automatically sets the port type to "number". Additional configuration options (like defaultValue, min, max, etc.)
 * can be passed if needed.
 *
 * Usage examples:
 *
 *   // Using default configuration:
 *   @PortNumber()
 *   public myNumber: number = 0;
 *
 *   // With custom configuration:
 *   @PortNumber({ defaultValue: 42, min: 0, max: 100, integer: true })
 *   public myNumber?: number;
 *
 * @param config Optional configuration object for number-specific options.
 */
export function PortNumber(config?: Omit<PortDecoratorOptions<'number'>, 'type'>): PropertyDecorator {
  return Port({
    type: 'number',
    ...config,
    ...('defaultValue' in (config || {})
      ? { defaultValue: config?.defaultValue }
      : { defaultValue: undefined }),
  })
}

/**
 * Boolean decorator to specify a port configuration for type "boolean".
 * This decorator automatically sets the port type to "boolean". Additional configuration options (like defaultValue, etc.)
 * can be provided.
 *
 * Usage examples:
 *
 *   // Using default configuration:
 *   @PortBoolean()
 *   public myFlag: boolean = false;
 *
 *   // With custom configuration:
 *   @PortBoolean({ defaultValue: true })
 *   public myFlag?: boolean;
 *
 * @param config Optional configuration object for boolean-specific options.
 */
export function PortBoolean(config?: Omit<PortDecoratorOptions<'boolean'>, 'type'>): PropertyDecorator {
  return Port({
    type: 'boolean',
    ...config,
    ...('defaultValue' in (config || {})
      ? { defaultValue: config?.defaultValue }
      : { defaultValue: false }),
  })
}

/**
 * PortAny decorator to specify a port configuration for type "any".
 * @param config Optional configuration object for additional options.
 */
export function PortAny(config?: Omit<PortDecoratorOptions<'any'>, 'type'>): PropertyDecorator {
  return Port({
    type: 'any',
    ...config,
  })
}
