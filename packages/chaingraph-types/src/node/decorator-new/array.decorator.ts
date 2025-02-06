import type { ObjectPortSchemaInput, PortDecoratorOptions } from '@chaingraph/types/node'
import { Port } from './port.decorator'

/**
 * PortArray decorator to specify a port configuration for type "array".
 *
 * This decorator automatically sets the port type to "array". You do not need to provide the type;
 * you only need to pass additional options (for example, an itemConfig to define the configuration
 * for array elements).
 *
 * IMPORTANT: For array ports you must supply an "itemConfig" property in the configuration. Omission
 * of this property will cause an error during port initialization.
 *
 * Usage examples:
 *
 *   // With a custom array configuration:
 *   @PortArray({
 *     itemConfig: {
 *       type: 'number',
 *       defaultValue: 0,
 *     },
 *     defaultValue: [1, 2, 3],
 *   })
 *   public myArray!: number[];
 *
 *   // With default array port configuration (if a default item config is acceptable):
 *   @PortArray({
 *     itemConfig: { type: 'string' }
 *   })
 *   public myStringArray!: string[];
 *
 * @param config Optional configuration object for additional array-specific options.
 */
export function PortArray(config: Omit<PortDecoratorOptions<'array'>, 'type'>): PropertyDecorator {
  return Port({
    type: 'array',
    ...config,
  })
}

/**
 * Helper decorator for an array port where each element is a number.
 *
 * This decorator presets the itemConfig for the port to { type: 'number' }.
 *
 * Usage example:
 *   @PortArrayNumber({ defaultValue: [1, 2, 3] })
 *   public numbers!: number[];
 *
 * @param config Optional additional configuration for the array port (excluding type and itemConfig).
 */
export function PortArrayNumber(config?: Omit<PortDecoratorOptions<'array'>, 'type' | 'itemConfig'>): PropertyDecorator {
  return PortArray({
    // Preset the item configuration for number elements.
    itemConfig: { type: 'number' },
    ...config,
  })
}

/**
 * Helper decorator for an array port where each element is a string.
 *
 * This decorator presets the itemConfig for the port to { type: 'string' }.
 *
 * Usage example:
 *   @PortArrayString({ defaultValue: ['a', 'b'] })
 *   public strings!: string[];
 *
 * @param config Optional additional configuration for the array port.
 */
export function PortArrayString(config?: Omit<PortDecoratorOptions<'array'>, 'type' | 'itemConfig'>): PropertyDecorator {
  return PortArray({
    // Preset the item configuration for string elements.
    itemConfig: { type: 'string' },
    ...config,
  })
}

/**
 * Helper decorator for an array port where each element is a boolean.
 *
 * This decorator presets the itemConfig for the port to { type: 'boolean' }.
 *
 * Usage example:
 *   @PortArrayBoolean({ defaultValue: [true, false] })
 *   public booleans!: boolean[];
 *
 * @param config Optional additional configuration for the array port.
 */
export function PortArrayBoolean(config?: Omit<PortDecoratorOptions<'array'>, 'type' | 'itemConfig'>): PropertyDecorator {
  return PortArray({
    // Preset the item configuration for boolean elements.
    itemConfig: { type: 'boolean' },
    ...config,
  })
}

/**
 * Helper decorator for an array port where each element is an object.
 *
 * This decorator presets the item configuration for the port to { type: 'object', schema: providedSchema }.
 * The caller must supply the object schema (as an explicit schema object or via a class decorated with @ObjectSchema).
 *
 * Usage example:
 *   @PortArrayObject(MyObjectSchema, { defaultValue: [new MyObject()] })
 *   public objects!: MyObject[];
 *
 * @param schema The schema used to configure each object element.
 * @param config Optional additional configuration for the array port.
 */
export function PortArrayObject<T extends ObjectPortSchemaInput>(
  schema: T,
  config?: Omit<PortDecoratorOptions<'array'>, 'type' | 'itemConfig'>,
): PropertyDecorator {
  return PortArray({
    // Preset the item configuration for object elements with the provided schema.
    itemConfig: { type: 'object', schema, defaultValue: {} },
    ...config,
  })
}

/**
 * PortArrayNested decorator creates a nested array port.
 *
 * This decorator wraps the base @PortArray decorator and recursively constructs a nested array configuration.
 * The parameter `depth` defines how many levels of nested arrays should be created.
 *
 * If depth is 1, the decorator is equivalent to @PortArray with the supplied itemConfig.
 * For greater depths, it wraps the itemConfig in successive array-port configurations.
 *
 * Example usage:
 *   // Define a 2D array of numbers:
 *   @PortArrayNested(2, { type: 'number', defaultValue: 0 }, { defaultValue: [[0, 0]] })
 *   public matrix!: number[][];
 *
 *   // Define a 3D array of strings:
 *   @PortArrayNested(3, { type: 'string', defaultValue: '' })
 *   public nestedStrings!: string[][][];
 *
 * @param depth The number of nested array levels (must be at least 1).
 * @param itemConfig The configuration for the innermost port (non-array type) that populates the nested array.
 * @param config Optional additional configuration for the outer array port (excluding type and itemConfig).
 */
export function PortArrayNested(
  depth: number,
  itemConfig: any,
  config?: Omit<PortDecoratorOptions<'array'>, 'type' | 'itemConfig'>,
): PropertyDecorator {
  if (depth < 1) {
    throw new Error('PortArrayNested: depth must be at least 1.')
  }

  // Start with the innermost configuration.
  let nestedItemConfig = itemConfig

  // For each extra level, wrap the current configuration in an array descriptor.
  for (let i = 1; i < depth; i++) {
    nestedItemConfig = {
      type: 'array',
      itemConfig: nestedItemConfig,
    }
  }

  // Finally, use the base PortArray decorator with the computed nested item configuration.
  return PortArray({
    itemConfig: nestedItemConfig,
    ...config,
  })
}
