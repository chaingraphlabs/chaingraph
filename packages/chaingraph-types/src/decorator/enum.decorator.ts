/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPortConfig, NumberPortConfig, StringPortConfig } from '../port'
import type { PortDecoratorOptions } from './port.decorator.types'
import { getObjectSchema } from './object-schema.decorator'
import { Port } from './port.decorator'

/**
 * PortEnum decorator for defining an enum port.
 *
 * This decorator automatically sets the port type to "enum". The provided configuration should
 * include an "options" array with each option having its own id, defaultValue, type, and title,
 * as well as any other desired settings.
 *
 * For example:
 *
 *   @PortEnum({
 *     options: [
 *       { id: 'red', type: 'string', defaultValue: 'red', title: 'Red' },
 *       { id: 'green', type: 'string', defaultValue: 'green', title: 'Green' },
 *       { id: 'blue', type: 'string', defaultValue: 'blue', title: 'Blue' }
 *     ],
 *     defaultValue: 'red'
 *   })
 *   public colorEnum: string;
 *
 * @param config - The configuration object for the enum port (excluding the "type" property).
 */
export function PortEnum(
  config: Omit<PortDecoratorOptions<'enum'>, 'type'>,
): PropertyDecorator {
  return Port({
    type: 'enum',
    ...config,
  })
}

/**
 * StringEnum decorator creates an enum port from a list of string options.
 * Automatically sets the port type to "enum" and constructs options using the provided string array.
 *
 * Usage example:
 *   @StringEnum(['Red', 'Green', 'Blue'], { defaultValue: 'Red' })
 *   public colorEnum: string;
 *
 * @param options Array of string options for the enum port.
 * @param config Optional additional configuration for the enum port (excluding type).
 */
export function StringEnum(
  options: string[],
  config?: Omit<PortDecoratorOptions<'enum'>, 'type'>,
): PropertyDecorator {
  return Port({
    type: 'enum',
    options: options.map(opt => ({
      id: opt,
      type: 'string',
      defaultValue: opt,
      title: opt,
    })),
    ...config,
  })
}

/**
 * NumberEnum decorator creates an enum port from a list of number options.
 * Automatically sets the port type to "enum" and constructs options from the provided number array.
 *
 * Usage example:
 *   @NumberEnum([1, 2, 3], { defaultValue: '1' })
 *   public numberEnum: number;
 *
 * @param options Array of number options for the enum port.
 * @param config Optional additional configuration for the enum port (excluding type).
 */
export function NumberEnum(
  options: number[],
  config?: Omit<PortDecoratorOptions<'enum'>, 'type'>,
): PropertyDecorator {
  return Port({
    type: 'enum',
    options: options.map(opt => ({
      id: opt.toString(),
      type: 'number',
      defaultValue: opt,
      title: opt.toString(),
    })),
    ...config,
  })
}

/**
 * PortEnumFromObject decorator creates an enum port based on an object mapping.
 *
 * The keys of the provided object are used as option identifiers and titles, while their corresponding values
 * become the option's defaultValue. The option type is automatically inferred as follows:
 *
 *   - strings become type 'string'
 *   - numbers become type 'number'
 *   - booleans become type 'boolean'
 *   - objects (non-null) become type 'object'
 *
 * The default selected option (if not explicitly provided in config) is the first key from the mapping.
 *
 * Example usage:
 *
 *   const userStatusOptions = {
 *     active: new UserStatus('Active'),
 *     inactive: new UserStatus('Inactive'),
 *     pending: new UserStatus('Pending'),
 *   }
 *   // Here default will be "active" (first key)
 *   @PortEnumFromObject(userStatusOptions, { defaultValue: 'active' })
 *   public statusEnum: keyof typeof userStatusOptions;
 *
 * @param options - An object mapping keys to option values.
 * @param config - Optional configuration for the enum port (excluding the "type" property).
 */
export function PortEnumFromObject<T extends Record<string, any>>(
  options: T,
  config?: Omit<PortDecoratorOptions<'enum'>, 'type' | 'options'>,
): PropertyDecorator {
  // Create enum option configurations by iterating over the entries of the provided options.
  const optionConfigs = Object.entries(options).map(([id, value]) => {
    let config: IPortConfig | undefined
    if (typeof value === 'string') {
      config = {
        id,
        type: 'string',
        defaultValue: value,
        title: id,
      }
    } else if (typeof value === 'number') {
      config = {
        id,
        type: 'number',
        defaultValue: value,
        title: id,
      }
    } else if (typeof value === 'boolean') {
      config = {
        id,
        type: 'boolean',
        defaultValue: value,
        title: id,
      }
    } else if (typeof value === 'object' && value !== null) {
      const schema = getObjectSchema(value.constructor)
      if (!schema) {
        throw new Error(`PortEnumFromObject: Missing schema for object option "${id}"`)
      }

      config = {
        id,
        type: 'object',
        defaultValue: value,
        title: id,
        schema,
      }
    } else {
      throw new Error(`PortEnumFromObject: Unsupported option type for key "${id}": ${typeof value}`)
    }

    return config
  })

  // Use the first key as default if no defaultValue is provided.
  const defaultOptionId = optionConfigs.length > 0 ? optionConfigs[0].id : undefined

  // Build the complete enum configuration.
  const enumConfig: PortDecoratorOptions<'enum'> = {
    type: 'enum',
    options: optionConfigs,
    defaultValue: defaultOptionId,
    ...config,
  }

  return Port(enumConfig)
}

/**
 * PortEnumFromNative decorator creates an enum port from a native TypeScript enum.
 *
 * This helper extracts the enum keys and values, and builds an option configuration accordingly.
 * In this implementation the enum keys will be used as the option title, while the corresponding enum value
 * serves as the option id.
 *
 * For example, given:
 *
 *   enum Direction {
 *     Up = '1',
 *     Down = '2',
 *     Left = '3',
 *     Right = '4',
 *   }
 *
 * the generated enum options will have { id: '1', title: 'Up', ... } and so on.
 *
 * @param nativeEnum - A native TypeScript enum.
 * @param config - Optional configuration for the enum port (excluding the "type" property).
 */
export function PortEnumFromNative<E extends Record<string, string | number>>(
  nativeEnum: E,
  config?: Omit<PortDecoratorOptions<'enum'>, 'type' | 'options'>,
): PropertyDecorator {
  // Since native enums only include the keys (for string enums there's no reverse mapping)
  // we iterate over the keys.
  const optionKeys = Object.keys(nativeEnum) as Array<keyof E>

  const optionConfigs: Array<StringPortConfig | NumberPortConfig> = optionKeys.map((key) => {
    const value = nativeEnum[key]
    if (typeof value === 'number') {
      const numVal = value as number
      return {
        id: numVal.toString(),
        type: 'number',
        defaultValue: numVal,
        title: key.toString(),
      } as NumberPortConfig
    } else {
      const strVal = value as string
      return {
        id: strVal,
        type: 'string',
        defaultValue: strVal,
        title: key.toString(),
      } as StringPortConfig
    }
  })

  const defaultOptionId = optionConfigs.length > 0 ? optionConfigs[0].id : undefined

  const enumConfig: PortDecoratorOptions<'enum'> = {
    type: 'enum',
    ...config,
    defaultValue: defaultOptionId,
    options: optionConfigs,
  }

  return Port(enumConfig)
}
