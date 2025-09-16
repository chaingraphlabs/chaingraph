/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ConfigTypeMap, IObjectSchema, IPortConfig, PortType } from '../port'

// For the decorator API we “widen” the configuration type only if needed,
// but in our new design for object and array ports we no longer support shorthand.
// We require that the "type" property is always a literal.
export type IPortConfigForDecorator = Omit<IPortConfig, 'type'> & {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'stream' | 'enum' | 'any'
}

/**
 * New type for object–port schemas; the user may supply either an explicit
 * object schema (IObjectSchema) or a class constructor decorated with @ObjectSchema.
 */
export type ObjectPortSchemaInput = IObjectSchema | (new (...args: any[]) => any)

/**
 * For object ports, the "schema" property is required and accepts our union.
 * (Note that now the port config itself MUST have type: 'object'.)
 */
export type ObjectPortOptions = Omit<ConfigTypeMap['object'], 'schema'> & {
  schema: ObjectPortSchemaInput
}

/**
 * For array ports the "itemConfig" must be provided explicitly. If the items are
 * intended to be object ports, then the user MUST supply the explicit version:
 *
 *    { type: 'object', schema: SomeObjectSchema }
 *
 * If an array port is nested (an array of arrays), we allow a recursive definition.
 */
export interface ArrayPortItemConfigObject { type: 'object', schema: ObjectPortSchemaInput }

/**
 * Branch for nested array items: the inner array's itemConfig is defined recursively.
 */
export type ArrayPortItemConfigArray
  = Omit<ConfigTypeMap['array'], 'itemConfig'> & { itemConfig: ArrayPortItemConfig }

/**
 * The overall union for array port item configuration is then the union of:
 *   • the explicit object-port branch,
 *   • the recursive array branch,
 *   • and the default definition for array items.
 */
export type ArrayPortItemConfig
  = | ArrayPortItemConfigObject
    | ArrayPortItemConfigArray
    | ConfigTypeMap['array']['itemConfig']

/**
 * Finally, the overall PortDecoratorOptions is:
 * - For type "object", we require a "schema" field (explicitly).
 * - For type "array", we require an "itemConfig" property that accepts our union.
 * - For all other port types, the configuration is unchanged.
 */
export type PortDecoratorOptions<T extends PortType>
  = T extends 'object' ? ObjectPortOptions
    : T extends 'array' ? Omit<ConfigTypeMap['array'], 'itemConfig'> & { itemConfig: ArrayPortItemConfig }
      : ConfigTypeMap[T]
