/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import {
  ObjectSchema,
  PortAny,
  PortArray,
  PortBoolean,
  PortNumber,
  PortObject,
  PortString,
} from '@badaitech/chaingraph-types'

// Base schema for common port properties
@ObjectSchema({
  description: 'Base schema for common port properties',
  type: 'BasePortSchema',
})
export class BasePortSchema {
  @PortString({ description: 'Port type (string, number, boolean, etc.)' })
  type: string = ''

  @PortString({ description: 'Port identifier' })
  id: string = ''

  @PortString({ description: 'Key/name of the port' })
  key: string = ''

  @PortString({ description: 'Display title' })
  title: string = ''

  @PortString({ description: 'Detailed description' })
  description: string = ''

  @PortString({ description: 'Port direction (input or output)' })
  direction: string = ''

  @PortBoolean({ description: 'Whether the port is required' })
  required: boolean = false
}

// String port schema
@ObjectSchema({
  description: 'Schema for string port type',
  type: 'StringPortSchema',
})
export class StringPortSchema extends BasePortSchema {
  @PortString({ description: 'Default string value' })
  defaultValue: string = ''

  @PortNumber({ description: 'Minimum string length' })
  minLength?: number

  @PortNumber({ description: 'Maximum string length' })
  maxLength?: number

  @PortString({ description: 'Regular expression pattern' })
  pattern?: string

  @PortObject({
    schema: {
      type: 'object',
      properties: {
        isTextArea: { type: 'boolean', title: 'Is Text Area' },
        isPassword: { type: 'boolean', title: 'Is Password Field' },
        hidden: { type: 'boolean', title: 'Hidden' },
        disabled: { type: 'boolean', title: 'Disabled' },
      },
    },
    title: 'UI Configuration',
  })
  ui?: Record<string, any> = {}
}

// Number port schema
@ObjectSchema({
  description: 'Schema for number port type',
  type: 'NumberPortSchema',
})
export class NumberPortSchema extends BasePortSchema {
  @PortNumber({ description: 'Default number value' })
  defaultValue: number = 0

  @PortNumber({ description: 'Minimum value' })
  min?: number

  @PortNumber({ description: 'Maximum value' })
  max?: number

  @PortNumber({ description: 'Step value' })
  step?: number

  @PortBoolean({ description: 'Whether only integers are allowed' })
  integer?: boolean

  @PortObject({
    schema: {
      type: 'object',
      properties: {
        isSlider: { type: 'boolean', title: 'Is Slider' },
        leftSliderLabel: { type: 'string', title: 'Left Slider Label' },
        rightSliderLabel: { type: 'string', title: 'Right Slider Label' },
      },
    },
    title: 'UI Configuration',
  })
  ui?: Record<string, any> = {}
}

// Boolean port schema
@ObjectSchema({
  description: 'Schema for boolean port type',
  type: 'BooleanPortSchema',
})
export class BooleanPortSchema extends BasePortSchema {
  @PortBoolean({ description: 'Default boolean value' })
  defaultValue: boolean = false

  @PortObject({
    schema: {
      type: 'object',
      properties: {},
    },
    title: 'UI Configuration',
  })
  ui?: Record<string, any> = {}
}

// Array port schema
@ObjectSchema({
  description: 'Schema for array port type',
  type: 'ArrayPortSchema',
})
export class ArrayPortSchema extends BasePortSchema {
  @PortObject({
    schema: {
      type: 'object',
      properties: {},
      description: 'Configuration for array items',
    },
    title: 'Item Configuration',
  })
  itemConfig: Record<string, any> = {}

  @PortArray({
    itemConfig: { type: 'any' },
    title: 'Default Value',
    description: 'Default array value',
  })
  defaultValue: any[] = []

  @PortNumber({ description: 'Minimum array length' })
  minLength?: number

  @PortNumber({ description: 'Maximum array length' })
  maxLength?: number

  @PortBoolean({ description: 'Whether array is mutable' })
  isMutable?: boolean

  @PortObject({
    schema: {
      type: 'object',
      properties: {
        addItemFormHidden: { type: 'boolean', title: 'Hide Add Item Form' },
        itemDeletable: { type: 'boolean', title: 'Allow Item Deletion' },
      },
    },
    title: 'UI Configuration',
  })
  ui?: Record<string, any> = {}
}

// Object port schema
@ObjectSchema({
  description: 'Schema for object port type',
  type: 'ObjectPortSchema',
})
export class ObjectPortSchema extends BasePortSchema {
  @PortObject({
    schema: {
      type: 'object',
      properties: {},
      description: 'Object properties schema',
    },
    title: 'Schema Definition',
    isSchemaMutable: true,
  })
  schema: Record<string, any> = {}

  @PortObject({
    schema: {
      type: 'object',
      properties: {},
    },
    title: 'Default Value',
    description: 'Default object value',
  })
  defaultValue?: Record<string, any> = {}

  @PortBoolean({ description: 'Whether schema is mutable' })
  isSchemaMutable?: boolean

  @PortObject({
    schema: {
      type: 'object',
      properties: {
        collapsed: { type: 'boolean', title: 'Collapsed by Default' },
        keyDeletable: { type: 'boolean', title: 'Allow Key Deletion' },
      },
    },
    title: 'UI Configuration',
  })
  ui?: Record<string, any> = {}
}

// Enum port schema
@ObjectSchema({
  description: 'Schema for enum port type',
  type: 'EnumPortSchema',
})
export class EnumPortSchema extends BasePortSchema {
  @PortArray({
    itemConfig: {
      type: 'object',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', title: 'Option ID' },
          title: { type: 'string', title: 'Display Title' },
          type: { type: 'string', title: 'Value Type' },
          defaultValue: { type: 'any', title: 'Default Value' },
        },
      },
    },
    title: 'Options',
    description: 'Available enum options',
  })
  options: Record<string, any>[] = []

  @PortString({ description: 'Default selected option ID' })
  defaultValue?: string = ''

  @PortObject({
    schema: {
      type: 'object',
      properties: {},
    },
    title: 'UI Configuration',
  })
  ui?: Record<string, any> = {}
}

// Stream port schema
@ObjectSchema({
  description: 'Schema for stream port type',
  type: 'StreamPortSchema',
})
export class StreamPortSchema extends BasePortSchema {
  @PortObject({
    schema: {
      type: 'object',
      properties: {},
      description: 'Configuration for stream items',
    },
    title: 'Item Configuration',
  })
  itemConfig: Record<string, any> = {}

  @PortObject({
    schema: {
      type: 'object',
      properties: {},
    },
    title: 'UI Configuration',
  })
  ui?: Record<string, any> = {}
}

// Any port schema
@ObjectSchema({
  description: 'Schema for any port type',
  type: 'AnyPortSchema',
})
export class AnyPortSchema extends BasePortSchema {
  @PortObject({
    schema: {
      type: 'object',
      properties: {},
      description: 'Underlying type configuration (if any)',
    },
    title: 'Underlying Type',
  })
  underlyingType?: Record<string, any> = {}

  @PortAny({
    description: 'Default value',
  })
  defaultValue?: any

  @PortObject({
    schema: {
      type: 'object',
      properties: {},
    },
    title: 'UI Configuration',
  })
  ui?: Record<string, any> = {}
}

// Combined port schema with discriminated union
@ObjectSchema({
  description: 'Combined schema for all port types',
  type: 'PortSchemaUnion',
})
export class PortSchemaUnion {
  @PortString({ description: 'Port type discriminator' })
  type: string = ''

  // Using PortObject for the union, since we don't have a built-in discriminated union type
  @PortObject({
    schema: {
      type: 'object',
      properties: {},
    },
    title: 'Port Configuration',
    description: 'Configuration based on port type',
  })
  config: Record<string, any> = {}
}
