import type { PortDecoratorOptions } from '@chaingraph/types'
import { Port } from './port.decorator'

/**
 * PortObject decorator to specify a port configuration for type "object".
 *
 * This decorator automatically sets the port type to "object". You do not need to pass the type;
 * you only need to specify additional options (e.g. a schema, defaultValue, etc.).
 *
 * IMPORTANT: For object ports you must supply a "schema" property (either as an explicit object
 * schema or as a class constructor decorated with @ObjectSchema). If omitted, an error will be thrown
 * when the port configuration is processed.
 *
 * Usage examples:
 *
 *   // With a custom explicit schema:
 *   @PortObject({
 *     schema: MyObjectSchema,
 *     defaultValue: {}
 *   })
 *   public myObject!: MyObject;
 *
 *   // Alternatively, if using a class decorated with @ObjectSchema:
 *   @PortObject({ schema: MyDecoratedClass })
 *   public myObject!: MyDecoratedClass;
 *
 * @param config Optional configuration object for additional options.
 */
export function PortObject(config: Omit<PortDecoratorOptions<'object'>, 'type'>): PropertyDecorator {
  return Port({
    type: 'object',
    ...config,
  })
}
